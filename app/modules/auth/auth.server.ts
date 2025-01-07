import { redirect } from 'react-router';
import { Authenticator } from 'remix-auth';
import { OIDCStrategy } from 'remix-auth-openid';
import { clearSession, getSession, setSession } from './auth-session.server';
import { env } from '../env.server';
import { logFactory } from '../logger';

export interface User extends OIDCStrategy.BaseUser {
	name?: string;
}

const logger = logFactory('auth');

const authenticator = new Authenticator<User>();
const strategy = await OIDCStrategy.init<User>(
	{
		issuer: env.OIDC_ISSUER,
		client_id: env.OIDC_CLIENT_ID,
		redirect_uris: [
			process.env.NODE_ENV === 'development'
				? 'http://localhost:5173/auth/callback'
				: 'https://www.akarinext.org/auth/callback',
		],
		response_type: 'code',
		scopes: ['openid', 'profile', 'email'],
		token_endpoint_auth_method: 'none',
		post_logout_redirect_uris: [
			process.env.NODE_ENV === 'development'
				? 'http://localhost:5173/'
				: 'https://www.akarinext.org/',
		],
		revocation_endpoint: 'https://auth.akarinext.org/oauth/v2/revoke',
		end_session_endpoint: 'https://auth.akarinext.org/oidc/v1/end_session',
		userinfo_endpoint: 'https://auth.akarinext.org/oidc/v1/userinfo',
		https: true,
	},
	async ({ tokens, request }): Promise<User> => {
		if (!tokens.id_token) {
			throw new Error('No id_token in response');
		}

		if (!tokens.access_token) {
			throw new Error('No access_token in response');
		}

		return {
			sub: tokens.claims().sub,
			accessToken: tokens.access_token,
			idToken: tokens.id_token,
			refreshToken: tokens.refresh_token,
			expiredAt:
				Math.floor(new Date().getTime() / 1000) + (tokens.expires_in ?? 0),
		};
	},
);

authenticator.use(strategy, 'zitadel');

async function getUserSession(request: Request): Promise<User | null> {
	const user = await getSession<User>(request);
	if (!user) {
		try {
			const user = await authenticator.authenticate('zitadel', request);
			logger.info('[getUserSession] User authenticated:', user);
			const headers = await setSession(request, user);
			logger.info('[getUserSession] Redirecting to / with headers:', headers);
			throw redirect('/', { headers: headers });
		} catch (e) {
			if (e instanceof Response) {
				logger.error('[getUserSession] Response error:', e);
				throw e;
			}
			throw redirect('/');
		}
	}
	return user;
}
async function logout(request: Request) {
	const user = await getUserSession(request);
	if (!user) {
		return redirect('/auth/login');
	}

	try {
		await strategy.postLogoutUrl(user.idToken ?? '');
		const header = await clearSession(request);
		return redirect('/', { headers: header });
	} catch (e) {
		if (e instanceof Response) {
			return e.url;
		}
		throw e;
	}
}

export { authenticator, getUserSession, logout };
