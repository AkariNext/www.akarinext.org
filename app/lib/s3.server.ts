import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { env } from './env.server';
import { UploadHandler } from '@remix-run/node';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer, FileTypeResult } from 'file-type';
import { db } from './db.server';

export const s3Client = new S3Client({
	endpoint: env.S3_ENDPOINT,
	forcePathStyle: true,
	region: env.S3_REGION,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY!,
		secretAccessKey: env.S3_SECRET_KEY!,
	},
});

function convertToStream(buffer: Buffer) {
	const stream = new Readable();
	stream.push(buffer);
	stream.push(null);
	return stream;
}

async function convertToBuffer(a: AsyncIterable<Uint8Array>) {
	const chunks: Uint8Array[] = [];
	for await (const chunk of a) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

export async function uploadStreamToSpaces(
	authorId: string,
	stream: Readable,
	filename: string,
	contentType: FileTypeResult,
) {
	const key = uuidv4();

	const parallelUploads = new Upload({
		client: s3Client,
		params: {
			Bucket: env.S3_BUCKET_NAME!,
			Key: `${env.S3_PREFIX}/${key}.${contentType.ext}`,
			Body: stream,
			ContentType: contentType.mime,
		},
	});

	const res = await parallelUploads.done();
	await db.file.create({
		data: {
			id: key,
			filename,
			mimetype: contentType.mime,
			url: res.Location!,
			author: { connect: { id: authorId } },
		},
	});
	return res.Location;
}

export const uploadFromUrl = async (authorId: string, url: string) => {
	const response = await fetch(url);
	const buffer = Buffer.from(await response.arrayBuffer());
	const body = convertToStream(buffer);
	const contentType = await fileTypeFromBuffer(buffer);

	if (!contentType) {
		throw new Error('Could not determine file type');
	}

	const uploadedFileLocation = await uploadStreamToSpaces(
		authorId,
		body,
		'',
		contentType,
	);
	return uploadedFileLocation;
};

export const uploadHandler = (
	authorId: string,
	allowedContentTypes?: string[],
) => {
	const s3UploadHandler: UploadHandler = async ({ filename, data }) => {
		if (!filename) {
			throw new Error('No filename provided');
		}

		const buffer = await convertToBuffer(data);
		const body = convertToStream(buffer);
		const contentType = await fileTypeFromBuffer(buffer);
		if (!contentType) {
			throw new Error('Could not determine file type');
		}

		if (allowedContentTypes) {
			let canUpload = false;
			for (const allowedType of allowedContentTypes) {
				if (contentType.mime === allowedType) {
					canUpload = true;
					break;
				}
			}

			if (!canUpload) {
				throw new Error('File type not allowed');
			}
		}

		const uploadedFileLocation = await uploadStreamToSpaces(
			authorId,
			body,
			filename!,
			contentType,
		);
		return uploadedFileLocation;
	};

	return { s3UploadHandler };
};
