import 'dotenv/config';

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	server: {
		POSTGRES_USER: z.string(),
		POSTGRES_PASSWORD: z.string(),
		POSTGRES_DB: z.string(),
		POSTGRES_HOST: z
			.optional(z.string())
			.default('akarinext-web-pg-rw.akarinext-web'),
		POSTGRES_PORT: z.optional(z.string()).default('5432'),

		KEYDB_HOST: z.string(),
		KEYDB_PORT: z.string(),
		KEYDB_PASSWORD: z.string(),

		S3_BUCKET_NAME: z.string(),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_REGION: z.string(),
		S3_ENDPOINT: z.string(),
		S3_PREFIX: z.string().default('*'),
	},
	runtimeEnv: process.env,
});
