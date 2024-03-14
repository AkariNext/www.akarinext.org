import { z } from "zod";

const schema = z.object({
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z.optional(z.string()),

    S3_BUCKET_NAME: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_REGION: z.string(),
    S3_ENDPOINT: z.string(),
    S3_PREFIX: z.string().default("*"),
});

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof schema> { }
    }
}

/**
 * 環境変数の初期化
 * 
 * 環境変数が正しく設定されているかをチェックし、
 * それが正しくない場合はエラーを投げる
 * 
 * @throws {Error} 環境変数が正しく設定されていない場合
 */
export function initEnv() {
    const parsed = schema.safeParse(process.env);

    if (parsed.success === false) {
        console.error("Invalid enviroment variables", parsed.error.flatten().fieldErrors);

        throw new Error("Invalid environment variables");
    }
}
