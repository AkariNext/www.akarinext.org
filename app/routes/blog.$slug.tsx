import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getBlogPost } from "../lib/blog.server";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params, request }: LoaderFunctionArgs) {
    let { slug } = params;
    invariant(!!slug, "Expected slug to be defined");
    let requestUrl = new URL(request.url);
    let siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    let post = await getBlogPost(slug);
    return json({ siteUrl, post }, {
        headers: {
            "Cache-Control": "max-age=300"
        }
    })
}

export const meta: MetaFunction<typeof loader> = ({data, params}) => {
    const {slug} = params;
    invariant(!!slug, "Expected slug to be defined");

    let { siteUrl, post } = data || {};
    if (!post) return [{title: "404 Not Found", status: 404}]

    return [
        {title: `${post.title} | AkariNext`},
        {name: "twitter:card", content: "summary"},
        {name: "twitter:site", content: "@AkariNext"},
        {name: "twitter:title", content: post.title},
        {name: "twitter:image", content: post.image},
        {name: "og:title", content: post.title},
        {name: "og:image", content: post.image},
        {name: "og:type", content: "article"},
        {name: "og:site_name", content: "AkariNext"},
        {name: "og:locale", content: "ja_JP"},
    ]
}


export default function BlogPost() {
    const { post } = useLoaderData<typeof loader>();

    return (
        <div>
            <div className="text-2xl mb-8 text-center">{post.title}</div>
            <div className="text-center">{post.dateDisplay}</div>
            <div dangerouslySetInnerHTML={{ __html: post.html }} className="mdx" />
        </div>
    )
}
