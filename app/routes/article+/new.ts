import { v4 } from 'uuid';
import { redirect } from '@remix-run/react';
import { db } from '~/lib/db.server';

export async function action() {

	const genKey = async () => {
		let key = v4();
	
		const foundPost = await db.post.findFirst({where: {
			id: key
		}});

		if (foundPost) {
			key = await genKey();
		}

		return key;
	}

	const postKey = await genKey();


	return redirect(`/articles/${postKey}/edit`);
}
