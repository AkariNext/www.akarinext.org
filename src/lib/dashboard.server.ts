import type { AstroCookies } from "astro";
import { AUTH_COOKIE } from "./auth";
import { type PbRecord, POCKETBASE_URL, shapeGame, shapePost } from "./cms";
import type { CmsGameEntry, CmsPost } from "./cms-types";

interface PbListResult {
	items?: PbRecord[];
}

export class DashboardError extends Error {
	constructor(
		message: string,
		public readonly status = 500,
	) {
		super(message);
	}
}

function escapeFilter(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function authToken(cookies: AstroCookies): string {
	const token = cookies.get(AUTH_COOKIE)?.value;
	if (!token) throw new DashboardError("ログインし直してください。", 401);
	return token;
}

async function requestPocketBase(
	token: string,
	collection: string,
	options: {
		id?: string;
		method?: "GET" | "POST" | "PATCH" | "DELETE";
		search?: URLSearchParams;
		body?: BodyInit;
	} = {},
): Promise<PbRecord | PbListResult | null> {
	const path = options.id ? `/records/${options.id}` : "/records";
	const query = options.search?.toString();
	const response = await fetch(
		`${POCKETBASE_URL}/api/collections/${collection}${path}${query ? `?${query}` : ""}`,
		{
			method: options.method ?? "GET",
			headers: { Authorization: token },
			body: options.body,
			cache: "no-store",
		},
	);

	if (response.status === 204) return null;
	if (!response.ok) {
		let message = "保存できませんでした。入力内容を確認してください。";
		try {
			const detail = (await response.json()) as { message?: string };
			if (detail.message) message = detail.message;
		} catch {
			// PocketBase が JSON を返さない場合は一般的な文言を使う。
		}
		throw new DashboardError(message, response.status);
	}
	return (await response.json()) as PbRecord | PbListResult;
}

export function getDashboardToken(cookies: AstroCookies): string {
	return authToken(cookies);
}

/** Cookie 認証を使う書き込みは、自サイトのフォームからだけ受け付ける。 */
export function isSameOriginRequest(request: Request, site?: URL): boolean {
	const source = request.headers.get("origin");
	const fetchSite = request.headers.get("sec-fetch-site");
	if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
		return false;
	}
	if (!source) return true;
	const allowed = new Set(
		[new URL(request.url).origin, site?.origin].filter(Boolean),
	);
	return allowed.has(source);
}

export async function listOwnPosts(
	token: string,
	userId: string,
): Promise<CmsPost[]> {
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "-updated",
		expand: "author,tags,series",
		filter: `author = '${escapeFilter(userId)}'`,
	});
	const result = (await requestPocketBase(token, "posts", {
		search,
	})) as PbListResult;
	return (result.items ?? []).map(shapePost);
}

export async function getOwnPost(
	token: string,
	userId: string,
	postId: string,
): Promise<CmsPost> {
	const search = new URLSearchParams({ expand: "author,tags,series" });
	const record = (await requestPocketBase(token, "posts", {
		id: postId,
		search,
	})) as PbRecord;
	if (String(record.author) !== userId) {
		throw new DashboardError("この記事を編集する権限がありません。", 403);
	}
	return shapePost(record);
}

export async function listOwnGameEntries(
	token: string,
	userId: string,
): Promise<CmsGameEntry[]> {
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "-updated",
		expand: "game",
		filter: `user = '${escapeFilter(userId)}'`,
	});
	const result = (await requestPocketBase(token, "user_games", {
		search,
	})) as PbListResult;
	return (result.items ?? []).flatMap((record) => {
		const game = record.expand?.game;
		if (!game || Array.isArray(game)) return [];
		return [
			{
				id: record.id,
				list: record.list === "finished" ? "finished" : "playing",
				game: shapeGame(game),
				skill_level: String(record.skill_level || "") || undefined,
				impression: String(record.impression || "") || undefined,
				recruitment: String(record.recruitment || "") || undefined,
			} satisfies CmsGameEntry,
		];
	});
}

export async function createRecord(
	token: string,
	collection: "posts" | "user_games" | "media",
	body: FormData,
): Promise<PbRecord> {
	return (await requestPocketBase(token, collection, {
		method: "POST",
		body,
	})) as PbRecord;
}

export async function updateRecord(
	token: string,
	collection: "posts" | "user_games",
	id: string,
	body: FormData,
): Promise<PbRecord> {
	return (await requestPocketBase(token, collection, {
		id,
		method: "PATCH",
		body,
	})) as PbRecord;
}

export async function deleteRecord(
	token: string,
	collection: "posts" | "user_games",
	id: string,
): Promise<void> {
	await requestPocketBase(token, collection, { id, method: "DELETE" });
}

const GAME_LISTS = new Set(["playing", "finished"]);
const GAME_SKILLS = new Set([
	"",
	"casual",
	"intermediate",
	"expert",
	"better_than_you",
]);
const GAME_IMPRESSIONS = new Set([
	"",
	"obsessed",
	"love",
	"like",
	"meh",
	"give_up",
]);
const GAME_RECRUITMENT = new Set([
	"",
	"looking_for_group",
	"invite_anytime",
	"need_hints",
	"can_teach",
	"discussion_welcome",
]);

function formText(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function gameRecordBody(input: FormData, userId?: string): FormData {
	const list = formText(input, "list");
	const skill = formText(input, "skill_level");
	const impression = formText(input, "impression");
	const recruitment = formText(input, "recruitment");
	if (
		!GAME_LISTS.has(list) ||
		!GAME_SKILLS.has(skill) ||
		!GAME_IMPRESSIONS.has(impression) ||
		!GAME_RECRUITMENT.has(recruitment)
	) {
		throw new DashboardError("ゲームの設定値が正しくありません。", 400);
	}
	const body = new FormData();
	body.set("list", list);
	body.set("skill_level", skill);
	body.set("impression", impression);
	body.set("recruitment", recruitment);
	if (userId) {
		const game = formText(input, "game");
		if (!game) throw new DashboardError("ゲームを選んでください。", 400);
		body.set("user", userId);
		body.set("game", game);
	}
	return body;
}

/** ダッシュボードと互換APIで共用するゲーム棚の保存処理。 */
export async function mutateGameEntry(
	token: string,
	userId: string,
	input: FormData,
): Promise<"game-added" | "game-saved" | "game-deleted"> {
	const action = formText(input, "_action");
	const id = formText(input, "id");
	const entries = await listOwnGameEntries(token, userId);
	const current = id ? entries.find((entry) => entry.id === id) : undefined;

	if (action === "delete") {
		if (!current)
			throw new DashboardError("削除するゲームが見つかりません。", 404);
		await deleteRecord(token, "user_games", id);
		return "game-deleted";
	}
	if (action === "update") {
		if (!current)
			throw new DashboardError("編集するゲームが見つかりません。", 404);
		await updateRecord(token, "user_games", id, gameRecordBody(input));
		return "game-saved";
	}

	const gameId = formText(input, "game");
	if (entries.some((entry) => entry.game.id === gameId))
		throw new DashboardError("このゲームはすでに登録されています。", 400);
	await createRecord(token, "user_games", gameRecordBody(input, userId));
	return "game-added";
}
