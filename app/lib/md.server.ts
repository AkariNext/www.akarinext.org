import parseFrontMatter from 'front-matter';
import { getSingletonHighlighterCore } from 'shiki/core';
import getWasm from 'shiki/wasm';
import { summaly } from '@misskey-dev/summaly';

import { LRUCache } from 'lru-cache';
import Summary from '@misskey-dev/summaly/built/summary';
import { visit } from "unist-util-visit";

const cache = new LRUCache<string, any>({
	max: 500, // キャッシュの最大エントリ数
});

function youtubePlayer(summary: Summary) {
	return `
    <div style="position: relative; width: 100%; height: 0; padding-top: 56.25%;">
        <iframe style="border-radius: 4px; position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="${summary.player.url}" allow=${summary.player.allow.join(';')} height="${summary.player.height}" width="${summary.player.width}" frameborder="0"></iframe>
    </div>
    `;
}

function defaultSummary(summary: Summary, url: string) {
	return `
        <div>
            <a class="link-card" href="${url}" target="_blank">
                <div class="link-card-content">
                    <strong>${summary.title}</strong>
                    ${summary.description ? `<p class="link-card-description">${summary.description}</p>` : ''}
                    <div class="link-card-footer">
                        <img src="${summary.icon}"/>
                        <p>${decodeURI(url)}</p>
                    </div>
                </div>
                <img src="${summary.thumbnail}" class="link-card-thumbnail" alt="thumbnail" />
            </a>
        </div>
                        `;
}

export default function remarkLinkCard() {
	return async function transformer(tree: any) {
		const promises: Promise<void>[] = [];

		visit(tree, 'paragraph', (node, index, parent) => {
			/*要件
			
			1. リンクのみの段落に対してのみ処理を行う
			2. リンクのテキストがリンク先URLと同じ場合のみ処理を行う
			3. リスト内のリンクはスキップする
			4. リンク先がキャッシュに存在する場合はキャッシュを使う
			5. キャッシュが存在しない場合はsummalyを使って情報を取得する
			6. キャッシュに情報を保存する
			7. キャッシュを使ってリンクカードを生成する
			8. リンク先がyoutubeの場合は埋め込みプレイヤーを生成する
			9. リンク先がyoutubeでない場合はデフォルトのリンクカードを生成する
			*/

			
			const maybelink = node.children[0];  // おそらくリンク

			if (node.children.length !== 1) return;
			if (maybelink.type !== 'link') return;
			if (maybelink.children.length !== 1) return;

			const isPlainText = maybelink.children[0].type === 'text' && maybelink.url === maybelink.children[0].value;
			if (!isPlainText) return;

			if (!parent || index === undefined) return;

			// listの中にある場合はスキップ
			if (parent.type === 'list' || parent.type === 'listItem') return;

			const url = maybelink.url;

			const cachedSummary = cache.get(url);

			if (cachedSummary) {
				node.type = 'html';
				node.value = cachedSummary.player.url?.includes('youtube')
					? youtubePlayer(cachedSummary)
					: defaultSummary(cachedSummary, url);
			} else {
				const promise = summaly(url)
					.then((summaryData) => {
						cache.set(url, summaryData); // キャッシュに保存
						node.type = 'html';
						node.value = summaryData.player.url?.includes('youtube')
							? youtubePlayer(summaryData)
							: defaultSummary(summaryData, url);
					})
					.catch((error) => {
						console.error(`Failed to fetch title for URL: ${url}`, error);
					});

				promises.push(promise);
			}
		});

		await Promise.all(promises);
	};
}

let highlighter: Awaited<ReturnType<typeof getSingletonHighlighterCore>>; // 何度も初期化しないためにキャッシュする
let processor: Awaited<ReturnType<typeof getProcessor>>; // 何度も初期化しないためにキャッシュする
export async function getProcessor() {
	const [
		{ unified },
		{ default: remarkGfm },
		{ default: remarkParse },
		{ default: remarkRehype },
		{ default: rehypeSlug },
		{ default: rehypeStringify },
		{ default: rehypeAutolinkHeadings },
		{ default: rehypeShikiFromHighlighter },
	] = await Promise.all([
		import('unified'),
		import('remark-gfm'),
		import('remark-parse'),
		import('remark-rehype'),
		import('rehype-slug'),
		import('rehype-stringify'),
		import('rehype-autolink-headings'),
		import('@shikijs/rehype/core'),
	]);
	highlighter =
		highlighter ||
		(await getSingletonHighlighterCore({
			themes: [import('shiki/themes/github-dark.mjs')],
			langs: [
				import('shiki/langs/javascript.mjs'),
				import('shiki/langs/typescript.mjs'),
				import('shiki/langs/python.mjs'),
				import('shiki/langs/bash.mjs'),
				import('shiki/langs/shell.mjs'),
				import('shiki/langs/diff.mjs'),
				import('shiki/langs/java.mjs'),
				import('shiki/langs/json.mjs'),
				import('shiki/langs/json5.mjs'),
			],
			loadWasm: getWasm,
		}));

	return unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkLinkCard) // 追加
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeStringify, { allowDangerousHtml: true })
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings)
		.use(rehypeShikiFromHighlighter, highlighter, { theme: 'github-dark' });
}

export async function processMarkdown(content: string) {
	processor = processor || (await getProcessor());
	const { attributes, body } = parseFrontMatter(content);
	const vfile = await processor.process(body);
	const html = vfile.value.toString();
	return { attributes, body, html };
}
