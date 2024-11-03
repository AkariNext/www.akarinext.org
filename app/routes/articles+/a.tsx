import { useLoaderData } from "@remix-run/react";
import { ArticleCardWithLink } from "~/components/ArticleCard";
import { db } from "~/lib/db.server";

export async function loader() {
    const posts = await db.post.findMany();
    return posts;
}

export default function NewBlogIndex() {
    const posts = useLoaderData<typeof loader>();
    return (
        <div>
            <div className="text-2xl  mb-16 text-center bg-white py-10">
                最新の記事
            </div>
            <div className="grid gap-8 grid-cols-3 akari-container">
                {posts.map((post) => (
                    <ArticleCardWithLink
                        key={post.title}
                        title={post.title}
                        emoji={"💩"}
                        classes={{ root: 'h-full' }}
                        slug={"aaa"}
                        dateDisplay={""}
                    />
                ))}
            </div>
        </div>
    );
}