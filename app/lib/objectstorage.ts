import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { db } from "./db.server";
import { files } from "src/schema";
import { getMIMEType } from "./helper.server";


class ObjectStorage {
    private client: S3Client;
    constructor() {
        this.client = new S3Client({
            region: process.env.S3_REGION,
            forcePathStyle: true,
            endpoint: process.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            }
        });
    }

    public async upload(options: { filename?: string, data: Buffer, userId: string }) {
        const { filename, data, userId } = options;

        const mime = await getMIMEType(data);

        const createdFile = await db.transaction(async (tx) => {
            return await tx.insert(files).values({
                name: filename,
                authorId: userId,
                url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/*${filename}`
            }).returning();
        })

        await this.client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: `${process.env.S3_PREFIX}/${createdFile[0].id}`, Body: data, ContentType: mime}));
    }
}

export const objectStorage = new ObjectStorage();
