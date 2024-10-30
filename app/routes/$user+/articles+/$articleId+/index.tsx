import invariant from 'tiny-invariant';
import { Link, useLoaderData } from '@remix-run/react';
import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from '@remix-run/node';

import '~/mdx.css';
import { getSocialIcon } from '~/lib/utils';
import { getBlogPost } from '../../../../lib/blog.server';
import { InlineIcon } from '@iconify/react/dist/iconify.js';
import { Avatar } from '~/components/Avatar';

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { articleId } = params;
	invariant(!!articleId, 'Expected articleId to be defined');
	const requestUrl = new URL(request.url);
	const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;

	const post = await getBlogPost(articleId);
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
	const { articleId } = params;
	invariant(!!articleId, 'Expected articleId to be defined');

	const { siteUrl, post } = data || {};
	if (!post) return [{ title: '404 Not Found', status: 404 }];

	const ogImageUrl = siteUrl ? new URL(`${siteUrl}/og/${articleId}`) : null;

	if (ogImageUrl) {
		ogImageUrl.searchParams.append('title', post.title);
		ogImageUrl.searchParams.append('displayDate', post.dateDisplay);
		ogImageUrl.searchParams.append(
			'authors',
			post.authors.map((a) => a.name).join(','),
		);
	}

	const socialImageUrl = ogImageUrl?.toString();

	return [
		{ title: `${post.title} | AkariNext` },
		{ name: 'twitter:card', content: 'summary_large_image' },
		{ name: 'twitter:site', content: '@AkariNext' },
		{ name: 'twitter:title', content: post.title },
		{ name: 'twitter:image', content: socialImageUrl },
		{ name: 'og:title', content: post.title },
		{ name: 'og:description', content: post.summary },
		{ name: 'og:image', content: socialImageUrl },
		{ name: 'og:type', content: 'article' },
		{ name: 'og:site_name', content: 'AkariNext' },
		{ name: 'og:locale', content: 'ja_JP' },
	];
};

export default function BlogPost() {
	const { post } = useLoaderData<typeof loader>();

	return (
		<div>
			<div className="flex justify-center px-8 sm:px-0 post-header">
				<div className="max-w-2xl w-full">
					<div className="flex justify-center">
						<InlineIcon
							style={{ viewTransitionName: 'blog-image' }}
							icon={`fluent-emoji-flat:${post.emoji}`}
							className="h-16 w-16 bg-white p-2 rounded-lg mb-4"
						/>
					</div>
					<div style={{ viewTransitionName: 'blog-title' }}>
						<div className="text-4xl mt-8">{post.title}</div>
						<div className="mt-2">{post.dateDisplay}</div>
					</div>
				</div>
			</div>
			<div className="mdx mdx-container">
				<div dangerouslySetInnerHTML={{ __html: post.html }} />

				<div className="border-t mt-8 block">
					{post.authors.map((author) => (
						<div key={author.name} className="flex items-center gap-4 mt-4">
							<Link to={`/member/${author.name}`}>
								<Avatar src={author.avatar} alt={author.name} />
							</Link>
							<div className="py-2 h-full">
								<div>
									{author.displayName ? author.displayName : author.name}
								</div>
								<div className="flex flex-wrap pt-2">
									{author.socials.map((social, index) => (
										<a
											key={index}
											href={social.url}
											target="_blank"
											rel="noopener noreferrer"
											className="mr-4 hover:transform hover:scale-110 transition-transform"
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
		</div>
	);
}
