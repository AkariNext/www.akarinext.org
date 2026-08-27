import type { APIRoute } from "astro";
import {
	createRecord,
	DashboardError,
	deleteRecord,
	getDashboardToken,
	isSameOriginRequest,
	listOwnGameEntries,
	updateRecord,
} from "../../../../lib/dashboard.server";

export const prerender = false;

const LISTS = new Set(["playing", "finished"]);
const SKILLS = new Set([
	"",
	"casual",
	"intermediate",
	"expert",
	"better_than_you",
]);
const IMPRESSIONS = new Set(["", "obsessed", "love", "like", "meh", "give_up"]);
const RECRUITMENT = new Set([
	"",
	"looking_for_group",
	"invite_anytime",
	"need_hints",
	"can_teach",
	"discussion_welcome",
]);

function text(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function gameBody(input: FormData, userId?: string): FormData {
	const list = text(input, "list");
	const skill = text(input, "skill_level");
	const impression = text(input, "impression");
	const recruitment = text(input, "recruitment");
	if (
		!LISTS.has(list) ||
		!SKILLS.has(skill) ||
		!IMPRESSIONS.has(impression) ||
		!RECRUITMENT.has(recruitment)
	)
		throw new DashboardError("ゲームの設定値が正しくありません。", 400);
	const body = new FormData();
	body.set("list", list);
	body.set("skill_level", skill);
	body.set("impression", impression);
	body.set("recruitment", recruitment);
	if (userId) {
		const game = text(input, "game");
		if (!game) throw new DashboardError("ゲームを選んでください。", 400);
		body.set("user", userId);
		body.set("game", game);
	}
	return body;
}

export const POST: APIRoute = async ({
	request,
	cookies,
	locals,
	redirect,
	site,
}) => {
	if (!locals.user) return redirect("/auth/login?next=/dashboard", 302);
	if (!isSameOriginRequest(request, site))
		return new Response("Forbidden", { status: 403 });
	try {
		const token = getDashboardToken(cookies);
		const input = await request.formData();
		const action = text(input, "_action");
		const id = text(input, "id");
		const entries = await listOwnGameEntries(token, locals.user.id);
		const current = id ? entries.find((entry) => entry.id === id) : undefined;

		if (action === "delete") {
			if (!current)
				throw new DashboardError("削除するゲームが見つかりません。", 404);
			await deleteRecord(token, "user_games", id);
			return redirect("/dashboard?notice=game-deleted#games", 303);
		}
		if (action === "update") {
			if (!current)
				throw new DashboardError("編集するゲームが見つかりません。", 404);
			await updateRecord(token, "user_games", id, gameBody(input));
			return redirect("/dashboard?notice=game-saved#games", 303);
		}

		const gameId = text(input, "game");
		if (entries.some((entry) => entry.game.id === gameId))
			throw new DashboardError("このゲームはすでに登録されています。", 400);
		await createRecord(token, "user_games", gameBody(input, locals.user.id));
		return redirect("/dashboard?notice=game-added#games", 303);
	} catch (error) {
		const message =
			error instanceof DashboardError
				? error.message
				: "ゲームを保存できませんでした。";
		return redirect(
			`/dashboard?error=${encodeURIComponent(message)}#games`,
			303,
		);
	}
};
