import type { APIRoute } from "astro";
import {
	DashboardError,
	getDashboardToken,
	isSameOriginRequest,
	mutateSeries,
} from "../../../../lib/dashboard.server";

export const prerender = false;

export const POST: APIRoute = async ({
	request,
	params,
	cookies,
	locals,
	redirect,
	site,
}) => {
	if (!locals.user) return redirect("/auth/login?next=/dashboard", 302);
	if (!isSameOriginRequest(request, site))
		return new Response("Forbidden", { status: 403 });

	const id = params.id ?? "";
	try {
		const token = getDashboardToken(cookies);
		const form = await request.formData();
		form.set("id", id);
		const result = await mutateSeries(token, locals.user.id, form);
		// 削除したら戻る先が無いのでダッシュボードへ
		if (result.notice === "series-deleted") {
			return redirect("/dashboard?notice=series-deleted#series", 303);
		}
		return redirect(`/dashboard/series/${id}?notice=${result.notice}`, 303);
	} catch (error) {
		const message =
			error instanceof DashboardError
				? error.message
				: "シリーズを保存できませんでした。";
		return redirect(
			`/dashboard/series/${id}?error=${encodeURIComponent(message)}`,
			303,
		);
	}
};
