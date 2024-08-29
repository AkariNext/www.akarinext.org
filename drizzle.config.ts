import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { env } from '~/lib/env.server';

export default {
	schema: 'src/schema.ts',
	out: './drizzle/',
	driver: 'pg',
	dbCredentials: {
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		database: env.POSTGRES_DB,
		host: env.POSTGRES_HOST
			? env.POSTGRES_HOST
			: 'akarinext-web-pg-rw.akarinext-web', // 開発環境ではホスト名を指定する
		port: env.POSTGRES_PORT ? parseInt(env.POSTGRES_PORT) : 5432,
	},
} satisfies Config;
