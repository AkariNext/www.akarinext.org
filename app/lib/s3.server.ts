import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { env } from './env.server';

export const s3Client = new S3Client({
	endpoint: env.S3_ENDPOINT,
	forcePathStyle: true,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY!,
		secretAccessKey: env.S3_SECRET_KEY!,
	},
});

export function uploadStreamToSpaces(
	stream: Readable,
	name: string,
	filename: string,
	encoding: string,
	mimetype: string,
) {
	return s3Client
		.send(
			new PutObjectCommand({
				Bucket: env.S3_BUCKET_NAME!,
				Key: `${env.S3_PREFIX}/${name}`,
				Body: stream,
				ContentDisposition: `inline; filename="${filename}"`,
				ContentType: mimetype,
				ContentEncoding: encoding,
			}),
		)
		.then(() => {
			return filename;
		})
		.catch((err) => {
			throw err;
		});
}
