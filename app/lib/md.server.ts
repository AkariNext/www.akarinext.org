import parseFrontMatter from "front-matter";



let processor: Awaited<ReturnType<typeof getProcessor>>;  // 何度も初期化しないためにキャッシュする
export async function getProcessor() {
    let [
        { unified },
        { default: remarkGfm },
        { default: remarkParse },
        { default: remarkRehype },
        { default: rehypeSlug },
        { default: rehypeStringify },
        { default: rehypeAutolinkHeadings },
    ] = await Promise.all([
        import("unified"),
        import("remark-gfm"),
        import("remark-parse"),
        import("remark-rehype"),
        import("rehype-slug"),
        import("rehype-stringify"),
        import("rehype-autolink-headings"),
    ])

    return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings);
}

export async function processMarkdown(content: string) {
    processor = processor || (await getProcessor());
    let { attributes, body } = parseFrontMatter(content);
    let vfile = await processor.process(body);
    let html = vfile.value.toString();
    return { attributes, body, html };
}