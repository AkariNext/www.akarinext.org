import { ActionFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/lib/auth.server';
import { processMarkdown } from '~/lib/md.server';

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.clone().formData();

	await authenticator.isAuthenticated(request, {
		failureRedirect: '/login',
	});

	const markdown = formData.get('markdown');

	if (!markdown) {
		return new Response('markdown is must required', { status: 400 });
	}
	return await processMarkdown(markdown.toString());
}
