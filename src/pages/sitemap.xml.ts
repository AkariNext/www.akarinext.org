import type { APIRoute } from "astro";
import { type CmsPost, cmsClient } from "../lib/cms";

export const prerender = false;

const origin = "https://www.akarinext.org";
const escapeXml = (value: string) =>
	value.replace(
		/[<>&'"]/g,
		(char) =>
			({
				"<": "&lt;",
				">": "&gt;",
				"&": "&amp;",
				"'": "&apos;",
				'"': "&quot;",
			})[char] || char,
	);

export const GET: APIRoute = async () => {
	let posts: CmsPost[] = [];
	try {
		posts = await cmsClient.items<CmsPost>("posts").readByQuery({
			limit: 500,
			sort: ["-published_date", "-createdAt", "-id"],
		});
	} catch (error) {
		console.error("[Sitemap] Error fetching posts", error);
	}

	const tagSlugs = new Set<string>();
	for (const post of posts)
		for (const tag of post.tags || []) if (tag.slug) tagSlugs.add(tag.slug);
	const entries = [
		{ path: "/", updated: undefined },
		{ path: "/posts", updated: posts[0]?.updatedAt },
		{ path: "/games", updated: undefined },
		{ path: "/announcements", updated: undefined },
		...posts.map((post) => ({
			path: `/posts/${post.slug || post.id}`,
			updated: post.updatedAt,
		})),
		...[...tagSlugs].map((slug) => ({
			path: `/tags/${slug}`,
			updated: undefined,
		})),
	];
	const urls = entries
		.map(({ path, updated }) => {
			const lastmod = updated
				? `<lastmod>${escapeXml(new Date(updated).toISOString())}</lastmod>`
				: "";
			return `<url><loc>${escapeXml(new URL(path, origin).href)}</loc>${lastmod}</url>`;
		})
		.join("");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
		{
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=0, s-maxage=3600",
			},
		},
	);
};
