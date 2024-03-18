import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../src/schema";
import { env } from "./env.server";

export const connection = postgres({
    database: env.POSTGRES_DB,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT ? parseInt(env.POSTGRES_PORT) : 5432,
})

export const db = drizzle(connection, { schema });
