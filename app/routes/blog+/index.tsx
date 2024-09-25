import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getBlogPostListings } from '~/lib/blog.server';
import { ArticleCardWithLink } from '~/components/ArticleCard';

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
			<div className="text-2xl  mb-16 text-center bg-white py-10">
				最新の記事
			</div>
			<div className="grid gap-8 grid-cols-3 akari-container">
				{posts.map((post) => (
					<ArticleCardWithLink key={post.slug} title={post.title} emoji={post.emoji} classes={{ root: "h-full" }} slug={post.slug} dateDisplay={post.dateDisplay} />

				))}
			</div>
		</div>
	);
}
