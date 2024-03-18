import 'dotenv/config';
import type { Config } from "drizzle-kit";
import { initEnv } from '~/lib/env.server';


initEnv();  // envが正しく設定されているかをチェックする

export default {
    schema: "src/schema.ts",
    out: "./drizzle/",
    driver: "pg",
    dbCredentials: {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        host: process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "akarinext-web-pg-rw.akarinext-web",  // 開発環境ではホスト名を指定する
        port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,

    }
} satisfies Config;
