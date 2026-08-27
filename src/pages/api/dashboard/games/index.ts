import type { APIRoute } from "astro";
import {
	DashboardError,
	getDashboardToken,
	isSameOriginRequest,
	mutateGameEntry,
} from "../../../../lib/dashboard.server";

export const prerender = false;

/** 旧送信先との互換用。直接開いた場合は編集画面へ戻す。 */
export const GET: APIRoute = ({ redirect }) =>
	redirect("/dashboard#games", 302);

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
		const notice = await mutateGameEntry(
			token,
			locals.user.id,
			await request.formData(),
		);
		return redirect(`/dashboard?notice=${notice}#games`, 303);
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
