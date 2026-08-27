import type { APIRoute } from "astro";
import {
	authWithOAuth2,
	CALLBACK_PATH,
	setAuthCookie,
	siteOrigin,
	takeOAuthCookie,
} from "../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect, site }) => {
	const stored = takeOAuthCookie(cookies);
	const next = cookies.get("pb_oauth_next")?.value || "/dashboard";
	cookies.delete("pb_oauth_next", { path: "/" });

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	// Discord 側で拒否された場合
	if (url.searchParams.get("error")) {
		return redirect("/auth/error?reason=denied", 302);
	}
	// state が一致しない、または一時 Cookie が失効している（CSRF 対策）
	if (!stored || !code || !state || state !== stored.state) {
		return redirect("/auth/error?reason=state", 302);
	}

	const result = await authWithOAuth2({
		code,
		codeVerifier: stored.codeVerifier,
		redirectURL: `${siteOrigin(site, url)}${CALLBACK_PATH}`,
	});
	if (!result) return redirect("/auth/error?reason=exchange", 302);

	setAuthCookie(cookies, result.token, import.meta.env.PROD);
	return redirect(next.startsWith("/") ? next : "/dashboard", 302);
};
