import { defineMiddleware } from "astro:middleware";
import {
	AUTH_COOKIE,
	type AuthUser,
	clearAuthCookie,
	refreshAuth,
	setAuthCookie,
} from "./lib/auth";
import { type PbRecord, shapeMember } from "./lib/cms";

/** ログインが必要なパス */
const PROTECTED = ["/dashboard", "/api/dashboard"];

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.user = null;

	const token = context.cookies.get(AUTH_COOKIE)?.value;
	if (token) {
		// auth-refresh が検証と延長を兼ねる。失効していれば Cookie を捨てる
		const result = await refreshAuth(token);
		if (result) {
			setAuthCookie(context.cookies, result.token, import.meta.env.PROD);
			const record = result.record as PbRecord;
			context.locals.user = {
				...shapeMember(record),
				email: typeof record.email === "string" ? record.email : undefined,
			} satisfies AuthUser;
		} else {
			clearAuthCookie(context.cookies);
		}
	}

	const path = context.url.pathname;
	if (!context.locals.user && PROTECTED.some((p) => path.startsWith(p))) {
		const nextPath = path.startsWith("/api/dashboard") ? "/dashboard" : path;
		return context.redirect(
			`/auth/login?next=${encodeURIComponent(nextPath)}`,
			302,
		);
	}

	return next();
});
