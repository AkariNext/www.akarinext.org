import parseFrontMatter from "front-matter";
import { getHighlighterCore } from 'shiki/core'
import getWasm from 'shiki/wasm'


let highlighter: Awaited<ReturnType<typeof getHighlighterCore>>;  // 何度も初期化しないためにキャッシュする
let processor: Awaited<ReturnType<typeof getProcessor>>;  // 何度も初期化しないためにキャッシュする
export async function getProcessor() {
    const [
        { unified },
        { default: remarkGfm },
        { default: remarkParse },
        { default: remarkRehype },
        { default: rehypeSlug },
        { default: rehypeStringify },
        { default: rehypeAutolinkHeadings },
        { default: rehypeShikiFromHighlighter }
    ] = await Promise.all([
        import("unified"),
        import("remark-gfm"),
        import("remark-parse"),
        import("remark-rehype"),
        import("rehype-slug"),
        import("rehype-stringify"),
        import("rehype-autolink-headings"),
        import("@shikijs/rehype/core"),
    ])
    highlighter = highlighter || await getHighlighterCore({
        themes: [
            import('shiki/themes/github-dark.mjs')
        ],
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
        loadWasm: getWasm
    })

    return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings)
        .use(rehypeShikiFromHighlighter, highlighter, { theme: "github-dark", })
}

export async function processMarkdown(content: string) {
    processor = processor || (await getProcessor());
    const { attributes, body } = parseFrontMatter(content);
    const vfile = await processor.process(body);
    const html = vfile.value.toString();
    return { attributes, body, html };
}