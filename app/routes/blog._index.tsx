import { json } from '@remix-run/node';
import { NavLink, useLoaderData } from '@remix-run/react';
import { getBlogPostListings } from '~/lib/blog.server';
import { InlineIcon } from '@iconify/react';

export async function loader() {
	return json(
		{ posts: await getBlogPostListings() },
		{ headers: { 'Cache-Control': 'max-age=300' } },
	);
}

export default function BlogIndex() {
	const { posts } = useLoaderData<typeof loader>();

	return (
		<div>
			<div className="text-2xl mb-8 text-center">最新の記事</div>
			<div className='flex flex-wrap gap-8'>
				{posts.map((post, index) => (
					<NavLink to={`/blog/${post.slug}`} key={index} className='sm:w-[calc(100%/3-32px)] w-full border-2 py-4 rounded-lg' unstable_viewTransition prefetch='intent'>
						{({ isTransitioning }) => (
							<div className='flex flex-col h-full p-8'>
								<div className='flex items-center justify-center border-b-2 mb-4'>
									<InlineIcon icon={`fluent-emoji-flat:${post.emoji}`} className='h-16 w-16 bg-white p-2 rounded-lg mb-4' style={
										isTransitioning
											? { viewTransitionName: 'blog-image' }
											: undefined
									} />
								</div>
								<h2 className="grow" style={
									isTransitioning
										? { viewTransitionName: 'blog-title' }
										: undefined
								}>{post.title}</h2>
								<p className='text-gray-600'>{post.dateDisplay}</p>
							</div>

						)}

					</NavLink>
				))}
			</div>
		</div>
	);
}
