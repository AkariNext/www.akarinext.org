import { json } from '@remix-run/node';
import { NavLink, useLoaderData } from '@remix-run/react';
import { getBlogPostListings } from '~/lib/blog.server';

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
			<NavLink to={`/blog/${posts[0].slug}`} unstable_viewTransition>
				{({ isTransitioning }) => (
					<>
						<div className="relative grid lg:grid-cols-12 sm:grid-cols-12 items-center justify-start sm:justify-between gap-4 bg-slate-200 p-8 rounded-2xl">
							<div
								className="lg:order-1 sm:order-2 w-full rounded-2xl lg:col-start-2 sm:col-start-1 lg:col-span-7"
								style={
									isTransitioning
										? { viewTransitionName: 'blog-title' }
										: undefined
								}
							>
								<div className="text-2xl">{posts[0].title}</div>
								<div>{posts[0].dateDisplay}</div>
							</div>
							<img
								src={posts[0].image}
								alt={posts[0].imageAlt}
								className="w-full object-cover lg:col-span-3 sm:col-span-1 h-96 rounded-lg aspect-[3/4] lg:order-2 sm:order-1"
								style={
									isTransitioning
										? { viewTransitionName: 'blog-image' }
										: undefined
								}
							/>
						</div>
					</>
				)}
			</NavLink>
			<div className="flex flex-wrap justify-center gap-x-8 mt-8">
				{posts.slice(1).map((post, index) => (
					<div key={index} className="mb-8">
						<NavLink
							to={`/blog/${post.slug}`}
							prefetch="intent"
							unstable_viewTransition
						>
							{({ isTransitioning }) => (
								<>
									<div>
										<img
											style={
												isTransitioning
													? { viewTransitionName: 'blog-image' }
													: undefined
											}
											src={post.image}
											alt={post.imageAlt}
											className="rounded-lg w-full object-cover h-[500px]"
										/>
									</div>
									<div
										className="mt-8"
										style={
											isTransitioning
												? { viewTransitionName: 'blog-title' }
												: undefined
										}
									>
										<div className="text-2xl">{post.title}</div>
										<div>{post.dateDisplay}</div>
									</div>
								</>
							)}
						</NavLink>
					</div>
				))}
			</div>
		</div>
	);
}
