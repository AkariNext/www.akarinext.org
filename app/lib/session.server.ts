import 'dotenv/config';

import { createCookieSessionStorage } from '@remix-run/node';
import { env } from './env.server';

export let sessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'auth_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24,
	},
});
