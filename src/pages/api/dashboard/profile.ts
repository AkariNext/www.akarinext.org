import type { APIRoute } from "astro";
import { clearAuthCookie } from "../../../lib/auth";
import {
	DashboardError,
	deleteOwnAccount,
	getDashboardToken,
	isSameOriginRequest,
	updateOwnProfile,
} from "../../../lib/dashboard.server";

export const prerender = false;

export const POST: APIRoute = async ({
	request,
	cookies,
	locals,
	redirect,
	site,
}) => {
	const user = locals.user;
	if (!user) return redirect("/auth/login?next=/dashboard/profile", 302);
	if (!isSameOriginRequest(request, site))
		return new Response("Forbidden", { status: 403 });

	const fail = (error: unknown, fallback: string) => {
		const message = error instanceof DashboardError ? error.message : fallback;
		return redirect(
			`/dashboard/profile?error=${encodeURIComponent(message)}`,
			303,
		);
	};

	let input: FormData;
	try {
		input = await request.formData();
	} catch (error) {
		return fail(error, "送信内容を読み取れませんでした。");
	}

	const token = getDashboardToken(cookies);

	if (input.get("_action") === "delete-account") {
		try {
			await deleteOwnAccount(token, user, input);
		} catch (error) {
			return fail(error, "アカウントを削除できませんでした。");
		}
		// 消したアカウントのトークンを持ち歩かせない
		clearAuthCookie(cookies);
		return redirect("/", 303);
	}

	try {
		await updateOwnProfile(token, user.id, input, user.social_links);
	} catch (error) {
		return fail(error, "プロフィールを保存できませんでした。");
	}
	return redirect("/dashboard/profile?notice=profile-saved", 303);
};
