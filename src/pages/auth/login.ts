import type { APIRoute } from "astro";
import {
	buildAuthorizeUrl,
	CALLBACK_PATH,
	getOAuthProvider,
	setOAuthCookie,
	siteOrigin,
} from "../../lib/auth";

export const prerender = false;

/** ログイン後の戻り先。オープンリダイレクトを避けて自サイト内のパスだけ許す */
function safeNext(value: string | null): string {
	if (!value || !value.startsWith("/") || value.startsWith("//"))
		return "/dashboard";
	return value;
}

export const GET: APIRoute = async ({ url, cookies, redirect, site }) => {
	const provider = await getOAuthProvider();
	if (!provider) {
		// PocketBase 側で Discord プロバイダが有効化されていない
		return redirect("/auth/error?reason=provider", 302);
	}

	const origin = siteOrigin(site, url);
	const next = safeNext(url.searchParams.get("next"));

	setOAuthCookie(
		cookies,
		{ state: provider.state, codeVerifier: provider.codeVerifier },
		import.meta.env.PROD,
	);
	// 戻り先は state と別に持たせる（Discord には渡さない）
	cookies.set("pb_oauth_next", next, {
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 5,
	});

	return redirect(
		buildAuthorizeUrl(provider, `${origin}${CALLBACK_PATH}`),
		302,
	);
};
