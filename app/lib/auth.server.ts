import 'dotenv/config';

import { Authenticator } from 'remix-auth';
import { sessionStorage } from './session.server';
import { OIDCStrategy, OIDCStrategyBaseUser } from 'remix-auth-openid';
import { db } from './db.server';
import { env } from './env.server';
import { uploadFromUrl } from './s3.server';

interface OIDCUser extends OIDCStrategyBaseUser {
	id: string;
	name: string;
	avatarUrl?: string | null;
}

export type User = {
	id: string;
	name: string;
	avatarUrl?: string | null;
};

export let authenticator = new Authenticator<OIDCUser>(sessionStorage);

interface Profile {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	nickname: string;
	picture: string;
	locale: string;
	updated_at: number;
	preferred_username: string;
	email: string;
	email_verified: boolean;
}

if (env.OIDC_REDIRECT_URIS.length === 0) {
	throw new Error('OIDC_REDIRECT_URIS is empty');
}

authenticator.use(
	await OIDCStrategy.init<OIDCUser>(
		{
			issuer: env.OIDC_ISSUER,
			client_id: env.OIDC_CLIENT_ID,
			redirect_uris: [process.env.NODE_ENV === "development" ? 'http://localhost:5173/auth/callback' : "https://www.akarinext.org/auth/callback"],
			response_type: 'code',
			scopes: ['openid', 'profile', 'email'],
			token_endpoint_auth_method: 'none',
		},
		async ({ tokens }): Promise<OIDCUser> => {
			if (!tokens.id_token) {
				throw new Error('No id_token found');
			}

			if (!tokens.access_token) {
				throw new Error('No access_token found');
			}

			const response = {
				...tokens.claims(),
				idToken: tokens.id_token,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiredAt: new Date().getTime() / 1000 + (tokens.expires_in ?? 0),
			};

			const foundUser = await db.user.findFirst({
				where: {
					sub: tokens.claims().sub,
				},
				select: {
					id: true,
					name: true,
					avatarUrl: true
				}
			});

			if (foundUser)
				return {...response, ...foundUser};

			const profileResponse = await fetch(env.OIDC_USERINFO_ENDPOINT, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			});

			const profile: Profile = await profileResponse.json();

			const user = await db.user.create({
				data: {
					sub: tokens.claims().sub,
					name: profile.name,
				},
			});

			const avatarUrl = await uploadFromUrl(user.id, profile.picture);
			if (avatarUrl) {
				await db.user.update({
					where: {
						id: user.id,
					},
					data: {
						avatarUrl,
					},
				});

				return {
					...response,
					id: user.id,
					name: user.name,
					avatarUrl,
				};
			}

			return {
				...response,
				id: user.id,
				name: user.name
			}
		},
	),
	'oidc',
);
