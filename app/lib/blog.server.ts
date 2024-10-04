import { LRUCache } from 'lru-cache';
import invariant from 'tiny-invariant';
import { processMarkdown } from './md.server';
import { MEMBERS, getAuthor, type TMember } from './member.server';
import { DateTime } from 'luxon';
import * as keywords from 'emojilib';

const POSTS = Object.fromEntries(
	Object.entries(
		import.meta.glob('../../data/posts/*.md', {
			query: '?raw',
			import: 'default',
			eager: true,
		}),
	).map(([filePath, contents]) => {
		invariant(
			typeof contents === 'string',
			`Expected ${filePath} to be a string, but got ${typeof contents}`,
		);

		return [
			filePath.replace('../../data/posts/', '').replace(/\.md$/, ''),
			contents,
		];
	}),
);

const AUTHORS = MEMBERS.map((m) => m.name);

interface MarkdownPost {
	title: string;
	summary: string;
	emoji: string;
	date: Date;
	dateDisplay: string;
	draft?: boolean;
	authors: string[];
	html: string;
}

export interface BlogPost extends Omit<MarkdownPost, 'authors'> {
	authors: TMember[];
}

const postsCache = new LRUCache<string, BlogPost>({
	maxSize: 1024 * 1024 * 12,
	sizeCalculation(v, k) {
		return JSON.stringify(v).length + (k ? k.length : 0); // キーの長さも考慮する
	},
});

function isValidMarkdownPostFrontmatter(obj: any): obj is MarkdownPost {
	// eslint-disable-line @typescript-eslint/no-explicit-any
	return (
		typeof obj === 'object' &&
		obj.title &&
		obj.summary &&
		typeof obj.emoji === 'string' &&
		obj.date instanceof Date &&
		(typeof obj.dfraft === 'undefined' || typeof obj.draft === 'boolean') &&
		Array.isArray(obj.authors)
	);
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
	const fondCache = postsCache.get(slug);
	if (fondCache) return fondCache;

	const contents = POSTS[slug];
	if (!contents) throw new Response('Not Found', { status: 404 });

	const { attributes, html } = await processMarkdown(contents);
	invariant(
		isValidMarkdownPostFrontmatter(attributes),
		`Invalid frontmatter for ${slug}`,
	);
	const validatedAuthors = attributes.authors.filter((author: string) =>
		AUTHORS.includes(author),
	);
	if (validatedAuthors.length === 0) {
		console.warn(
			`No valid authors found for ${slug}, falling back to the first author`,
		);
	}

	attributes.authors = validatedAuthors;

	const post: BlogPost = {
		...attributes,
		authors: validatedAuthors.map(getAuthor).filter((a): a is TMember => !!a),
		emoji: keywords.default[attributes.emoji][0].replaceAll('_', '-')!,
		dateDisplay: DateTime.fromJSDate(attributes.date)
			.plus(new Date().getTimezoneOffset()) // タイムゾーンを考慮する
			.toLocaleString(DateTime.DATE_FULL, { locale: 'ja-JP' }),
		html,
	};

	postsCache.set(slug, post);

	return post;
}

export async function getBlogPostListings() {
	const slugs = Object.keys(POSTS);
	const listings = [];

	for (const slug of slugs) {
		const { ...listing } = await getBlogPost(slug);
		if (listing.draft === false) continue;
		listings.push({ slug, ...listing });
	}

	return listings
		.sort((a, b) => b.date.getTime() - a.date.getTime())
		.map(({ ...listing }) => listing);
}

export async function getBlogPostListingsByUsername(username: string) {
	const slugs = Object.keys(POSTS);
	const listings = [];

	for (const slug of slugs) {
		const { ...listing } = await getBlogPost(slug);
		if (listing.draft === false) continue;
		if (listing.authors.some((author) => author.name === username)) {
			listings.push({ slug, ...listing });
		}
	}

	return listings
		.sort((a, b) => b.date.getTime() - a.date.getTime())
		.map(({ ...listing }) => listing);
}
