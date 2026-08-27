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
		const result = await mutateSeries(
			token,
			locals.user.id,
			await request.formData(),
		);
		return redirect(
			`/dashboard/series/${result.id}?notice=${result.notice}`,
			303,
		);
	} catch (error) {
		const message =
			error instanceof DashboardError
				? error.message
				: "シリーズを作成できませんでした。";
		return redirect(
			`/dashboard/series/new?error=${encodeURIComponent(message)}`,
			303,
		);
	}
};
