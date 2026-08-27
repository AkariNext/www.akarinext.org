import type { APIRoute } from "astro";
import { clearAuthCookie } from "../../lib/auth";

export const prerender = false;

/** ログアウトは副作用があるので POST のみ受ける */
export const POST: APIRoute = ({ cookies, redirect }) => {
	clearAuthCookie(cookies);
	return redirect("/", 302);
};
