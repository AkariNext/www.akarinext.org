import invariant from 'tiny-invariant';
import { useLoaderData } from '@remix-run/react';
import { type LoaderFunctionArgs, type MetaFunction, json } from '@remix-run/node';

import '../mdx.css';
import { getSocialIcon } from '~/lib/utils';
import { getBlogPost } from '../lib/blog.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { slug } = params;
	invariant(!!slug, 'Expected slug to be defined');
	const requestUrl = new URL(request.url);
	const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;

	const post = await getBlogPost(slug);
	return json(
		{ siteUrl, post },
		{
			headers: {
				'Cache-Control': 'max-age=300',
			},
		},
	);
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const { slug } = params;
	invariant(!!slug, 'Expected slug to be defined');

	const { siteUrl, post } = data || {};
	if (!post) return [{ title: '404 Not Found', status: 404 }];

	return [
		{ title: `${post.title} | AkariNext` },
		{ name: 'twitter:card', content: 'summary' },
		{ name: 'twitter:site', content: '@AkariNext' },
		{ name: 'twitter:title', content: post.title },
		{ name: 'twitter:image', content: post.image },
		{ name: 'og:title', content: post.title },
		{ name: 'og:description', content: post.summary },
		{ name: 'og:image', content: post.image },
		{ name: 'og:type', content: 'article' },
		{ name: 'og:site_name', content: 'AkariNext' },
		{ name: 'og:locale', content: 'ja_JP' },
	];
};

export default function BlogPost() {
	const { post } = useLoaderData<typeof loader>();

	return (
		<div className="mdx">
			<div className="text-2xl mb-8 text-center">{post.title}</div>
			<div className="text-center">{post.dateDisplay}</div>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
			<div dangerouslySetInnerHTML={{ __html: post.html }} />

			<div className="border-t mt-8 block">
				{post.authors.map((author) => (
					<div key={author.name} className="flex items-stretch gap-4 mt-4">
						<img
							src={author.avatar}
							alt={author.name}
							className="w-16 h-16 rounded-full"
						/>
						<div className="py-2 h-full">
							<div>{author.name}</div>
							<div className="flex flex-wrap pt-2">
								{author.socials.map((social, index) => (
									<a
										key={index}
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										className="mr-4"
									>
										{getSocialIcon(social.type, { size: 16 })}
									</a>
								))}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
