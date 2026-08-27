import type { APIRoute } from "astro";
import { clearAuthCookie } from "../../lib/auth";
import { isSameOriginRequest } from "../../lib/dashboard.server";

export const prerender = false;

/** ログアウトは副作用があるので POST のみ受ける */
export const POST: APIRoute = ({ request, cookies, redirect, site }) => {
	// 他サイトから勝手にログアウトさせられないようにする
	if (!isSameOriginRequest(request, site)) {
		return new Response("forbidden", { status: 403 });
	}
	clearAuthCookie(cookies);
	return redirect("/", 302);
};
