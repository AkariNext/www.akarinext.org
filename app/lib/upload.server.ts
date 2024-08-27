import type { UploadHandler } from '@remix-run/node';
import { convertToBuffer } from './helper.server';
import { objectStorage } from './objectstorage';

export const uploadHandler: UploadHandler = async ({ data, filename }) => {
	const buffer = await convertToBuffer(data);
	await objectStorage.upload({ filename, data: buffer, userId: '1' });
	return 'ok';
};
