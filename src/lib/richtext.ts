
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';
import { fetchOgp } from './ogp';

function rehypeOgpLinkCards() {
    return async (tree: any): Promise<void> => {
        const nodesToProcess: Array<{ node: any; parent: any; href: string }> = [];

        visit(tree, 'element', (node: any, _index: any, parent: any) => {
            if (node.tagName !== 'p' || !parent) return;

            // 空白テキストノードを除いた実質的な子要素を取得
            const meaningfulChildren = node.children.filter(
                (c: any) => !(c.type === 'text' && c.value.trim() === '')
            );
            if (
                meaningfulChildren.length === 1 &&
                meaningfulChildren[0].type === 'element' &&
                meaningfulChildren[0].tagName === 'a'
            ) {
                const anchor = meaningfulChildren[0];
                const href = anchor.properties?.href;
                if (href && typeof href === 'string' && href.startsWith('http')) {
                    nodesToProcess.push({ node, parent, href });
                }
            }
        });

        await Promise.all(
            nodesToProcess.map(async ({ node, parent, href }) => {
                try {
                    const data = await fetchOgp(href);
                    if (data && (data.ogTitle || data.ogDescription)) {
                        const title = data.ogTitle || data.twitterTitle || href;
                        const desc = data.ogDescription || data.twitterDescription || '';
                        const image = data.ogImage?.[0]?.url || data.twitterImage?.[0]?.url || '';
                        const siteName = data.ogSiteName || new URL(href).hostname;

                        const cardNode = h('a.link-card-rich', { href, target: '_blank', rel: 'noopener noreferrer' }, [
                            h('div.link-card-text', [
                                h('div.link-card-meta', [
                                    ...(image ? [h('img.link-card-favicon', { src: image, alt: '' })] : []),
                                    h('span', siteName),
                                ]),
                                h('div.link-card-title', title),
                                ...(desc ? [h('div.link-card-desc', desc)] : []),
                            ]),
                            ...(image ? [h('div.link-card-image', { style: `background-image: url('${image}')` })] : []),
                        ]);

                        const idx = parent.children.indexOf(node);
                        if (idx !== -1) {
                            parent.children.splice(idx, 1, cardNode);
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch OGP for ${href}:`, e);
                }
            })
        );
    };
}

export async function markdownToHtml(content: string | null | undefined): Promise<string> {
    if (!content) return '';

    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeOgpLinkCards)
        .use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
        .use(rehypeStringify)
        .process(content);

    return String(file);
}

