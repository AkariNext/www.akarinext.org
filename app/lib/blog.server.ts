import { LRUCache } from "lru-cache";
import invariant from "tiny-invariant";
import { processMarkdown } from "./md.server";
import { MEMBERS, TMember } from "./member.server";
import { DateTime } from "luxon";

const POSTS = Object.fromEntries(
    Object.entries(
        import.meta.glob("../../data/posts/*.md", {
            query: "?raw",
            import: "default",
            eager: true,
        }),
    ).map(([filePath, contents]) => {
        invariant(typeof contents === "string", `Expected ${filePath} to be a string, but got ${typeof contents}`);

        return [
            filePath.replace("../../data/posts/", "").replace(/\.md$/, ""),
            contents,
        ];
    }),
);

const AUTHORS = MEMBERS.map((m) => m.name);

interface MarkdownPost {
    title: string;
    summary: string;
    date: Date;
    dateDisplay: string;
    draft?: boolean;
    image?: string;
    imageAlt?: string;
    authors: string[];
    html: string;
}


export interface BlogPost extends Omit<MarkdownPost, "authors"> {
    authors: TMember[];
}

const postsCache = new LRUCache<string, BlogPost>({
    maxSize: 1024 * 1024 * 12,
    sizeCalculation(v, k) {
        return JSON.stringify(v).length + (k ? k.length : 0)  // キーの長さも考慮する
    }
})

function getAuthor(name: string) {
    return MEMBERS.find((m) => m.name === name);
}

function isValidMarkdownPostFrontmatter(obj: any): obj is MarkdownPost {
    return (
        typeof obj === "object" &&
        obj.title &&
        obj.summary &&
        obj.date instanceof Date &&
        (typeof obj.dfraft === "undefined" || typeof obj.draft === "boolean") &&
        (typeof obj.image === "undefined" || typeof obj.image === "string") &&
        (typeof obj.imageAlt === "undefined" || typeof obj.imageAlt === "string") &&
        Array.isArray(obj.authors)
    );
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
    let fondCache = postsCache.get(slug);
    if (fondCache) return fondCache;

    let contents = POSTS[slug];
    if (!contents) throw new Response("Not Found", { status: 404 });

    let { attributes, html } = await processMarkdown(contents);
    invariant(isValidMarkdownPostFrontmatter(attributes), `Invalid frontmatter for ${slug}`);
    let validatedAuthors = attributes.authors.filter((author: string) => AUTHORS.includes(author));
    if (validatedAuthors.length === 0) {
        console.warn(`No valid authors found for ${slug}, falling back to the first author`);
    }

    attributes.authors = validatedAuthors;

    let post: BlogPost = {
        ...attributes,
        image: attributes.image || "https://picsum.photos/200/300",
        imageAlt: attributes.imageAlt || "",
        authors: validatedAuthors.map(getAuthor).filter((a): a is TMember => !!a),
        dateDisplay: DateTime.fromJSDate(attributes.date)
            .plus(new Date().getTimezoneOffset()) // タイムゾーンを考慮する
            .toLocaleString(DateTime.DATE_FULL, { locale: 'ja-JP' }),
        html,
    };

    postsCache.set(slug, post);

    return post;
}

export async function getBlogPostListings() {
    let slugs = Object.keys(POSTS);
    let listings = []

    for (let slug of slugs) {
        let { html, authors, ...listing } = await getBlogPost(slug);
        if (listing.draft === false) continue;
        listings.push({ slug, ...listing });
    }

    return listings
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ date, ...listing }) => listing);;
}
