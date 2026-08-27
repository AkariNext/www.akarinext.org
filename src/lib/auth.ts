/**
 * PocketBase を使った Discord OAuth ログイン
 *
 * トークンはブラウザの JS に渡さず、httpOnly Cookie でサーバーとだけやり取りする。
 * 権限判定の実体は PocketBase 側のコレクションルールで、ここはその入口にすぎない。
 */

import type { AstroCookies } from "astro";
import { POCKETBASE_URL } from "./cms";
import type { CmsMember } from "./cms-types";

/** 認証トークンを保持する Cookie */
export const AUTH_COOKIE = "pb_auth";
/** OAuth 往復の間だけ state / codeVerifier を預ける Cookie */
export const OAUTH_COOKIE = "pb_oauth";

export const OAUTH_PROVIDER = "discord";
/** Discord Developer Portal に登録する Redirect URI のパス */
export const CALLBACK_PATH = "/auth/callback";

/** PocketBase が返す認証レスポンス */
interface AuthResponse {
	token: string;
	record: Record<string, unknown>;
}

interface OAuthProvider {
	name: string;
	displayName?: string;
	state: string;
	codeVerifier: string;
	authURL: string;
}

/** ログイン中のユーザー。middleware が locals.user に入れる */
export interface AuthUser extends CmsMember {
	email?: string;
}

function cookieOptions(secure: boolean, maxAge: number) {
	return {
		httpOnly: true,
		secure,
		sameSite: "lax" as const,
		path: "/",
		maxAge,
	};
}

/** 認証 Cookie を設定する。maxAge は PocketBase のトークン有効期限に合わせる */
export function setAuthCookie(
	cookies: AstroCookies,
	token: string,
	secure: boolean,
) {
	cookies.set(AUTH_COOKIE, token, cookieOptions(secure, 60 * 60 * 24 * 7));
}

export function clearAuthCookie(cookies: AstroCookies) {
	cookies.delete(AUTH_COOKIE, { path: "/" });
}

/**
 * OAuth の開始に必要な情報を取得する。
 * Discord プロバイダが PocketBase 側で未設定なら null。
 */
export async function getOAuthProvider(): Promise<OAuthProvider | null> {
	const res = await fetch(
		`${POCKETBASE_URL}/api/collections/users/auth-methods`,
		{ cache: "no-store" },
	);
	if (!res.ok) return null;
	const data = (await res.json()) as {
		oauth2?: { enabled?: boolean; providers?: OAuthProvider[] };
	};
	if (!data.oauth2?.enabled) return null;
	return data.oauth2.providers?.find((p) => p.name === OAUTH_PROVIDER) || null;
}

/** OAuth 往復用の一時 Cookie を書き込む（5 分で失効） */
export function setOAuthCookie(
	cookies: AstroCookies,
	value: { state: string; codeVerifier: string },
	secure: boolean,
) {
	cookies.set(
		OAUTH_COOKIE,
		JSON.stringify(value),
		cookieOptions(secure, 60 * 5),
	);
}

export function takeOAuthCookie(
	cookies: AstroCookies,
): { state: string; codeVerifier: string } | null {
	const raw = cookies.get(OAUTH_COOKIE)?.value;
	cookies.delete(OAUTH_COOKIE, { path: "/" });
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { state?: string; codeVerifier?: string };
		if (!parsed.state || !parsed.codeVerifier) return null;
		return { state: parsed.state, codeVerifier: parsed.codeVerifier };
	} catch {
		return null;
	}
}

/** 認可コードを PocketBase に渡してログインを確定する */
export async function authWithOAuth2(params: {
	code: string;
	codeVerifier: string;
	redirectURL: string;
}): Promise<AuthResponse | null> {
	const res = await fetch(
		`${POCKETBASE_URL}/api/collections/users/auth-with-oauth2`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider: OAUTH_PROVIDER, ...params }),
			cache: "no-store",
		},
	);
	if (!res.ok) {
		console.error(
			"[auth] auth-with-oauth2 failed",
			res.status,
			await res.text(),
		);
		return null;
	}
	return (await res.json()) as AuthResponse;
}

/**
 * トークンを検証しつつ延長する。
 * 無効・期限切れなら null を返すので、呼び出し側は Cookie を捨てる。
 */
export async function refreshAuth(token: string): Promise<AuthResponse | null> {
	const res = await fetch(
		`${POCKETBASE_URL}/api/collections/users/auth-refresh`,
		{
			method: "POST",
			headers: { Authorization: token },
			cache: "no-store",
		},
	);
	if (!res.ok) return null;
	return (await res.json()) as AuthResponse;
}

/** ログイン開始 URL。PocketBase が組み立てた authURL の末尾に redirect_uri を足す */
export function buildAuthorizeUrl(
	provider: OAuthProvider,
	redirectURL: string,
): string {
	return provider.authURL + encodeURIComponent(redirectURL);
}

/**
 * リダイレクト先の絶対 URL。
 * 本番はリバースプロキシ越しで Astro.url のスキームが当てにならないため、
 * astro.config の site を優先する。
 */
export function siteOrigin(site: URL | undefined, requestUrl: URL): string {
	if (import.meta.env.PROD && site) return site.origin;
	return requestUrl.origin;
}
