import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getBlogPostListings } from "~/lib/blog.server";

export async function loader() {
    return json({ posts: await getBlogPostListings() }, { headers: { "Cache-Control": "max-age=300" } })
}

export default function BlogIndex() {
    const { posts } = useLoaderData<typeof loader>();

    return (
        <div className="">
            {posts.length}
            <div className="text-2xl mb-8 text-center">最新の記事</div>
            <div className="flex flex-wrap justify-center gap-x-8">
                {posts.map((post, index) => (
                    <div key={index} className="mb-8">
                        <Link to={`/blog/${post.slug}`}>
                        <div className="text-2xl">{post.title}</div>
                        <div>{post.dateDisplay}</div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}