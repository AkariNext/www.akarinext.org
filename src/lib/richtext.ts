import rehypeShiki from "@shikijs/rehype";
import { h } from "hastscript";
import rehypeExternalLinks from "rehype-external-links";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { fetchOgp } from "./ogp";
import { getYouTubeEmbedUrl } from "./youtube";

function rehypeOgpLinkCards() {
	return async (tree: any): Promise<void> => {
		const nodesToProcess: Array<{ node: any; parent: any; href: string }> = [];

		visit(tree, "element", (node: any, _index: any, parent: any) => {
			if (node.tagName !== "p" || !parent) return;

			// 空白テキストノードを除いた実質的な子要素を取得
			const meaningfulChildren = node.children.filter(
				(c: any) => !(c.type === "text" && c.value.trim() === ""),
			);
			if (
				meaningfulChildren.length === 1 &&
				meaningfulChildren[0].type === "element" &&
				meaningfulChildren[0].tagName === "a"
			) {
				const anchor = meaningfulChildren[0];
				const href = anchor.properties?.href;
				if (href && typeof href === "string" && href.startsWith("http")) {
					nodesToProcess.push({ node, parent, href });
				}
			}
		});

		await Promise.all(
			nodesToProcess.map(async ({ node, parent, href }) => {
				try {
					const youtubeEmbedUrl = getYouTubeEmbedUrl(href);
					if (youtubeEmbedUrl) {
						const playerNode = h("div.link-card-youtube", [
							h("iframe", {
								src: youtubeEmbedUrl,
								title: "YouTube video player",
								loading: "lazy",
								allow:
									"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
								allowFullScreen: true,
							}),
						]);

						const youtubeIdx = parent.children.indexOf(node);
						if (youtubeIdx !== -1) {
							parent.children.splice(youtubeIdx, 1, playerNode);
						}
						return;
					}

					const data = await fetchOgp(href);
					if (data && (data.ogTitle || data.ogDescription)) {
						const title = data.ogTitle || data.twitterTitle || href;
						const desc = data.ogDescription || data.twitterDescription || "";
						const image =
							data.ogImage?.[0]?.url || data.twitterImage?.[0]?.url || "";
						const siteName = data.ogSiteName || new URL(href).hostname;

						const cardNode = h(
							"a.link-card-rich",
							{ href, target: "_blank", rel: "noopener noreferrer" },
							[
								h("div.link-card-text", [
									h("div.link-card-meta", [
										...(image
											? [h("img.link-card-favicon", { src: image, alt: "" })]
											: []),
										h("span", siteName),
									]),
									h("div.link-card-title", title),
									...(desc ? [h("div.link-card-desc", desc)] : []),
								]),
								...(image
									? [
											h("div.link-card-image", {
												style: `background-image: url('${image}')`,
											}),
										]
									: []),
							],
						);

						const idx = parent.children.indexOf(node);
						if (idx !== -1) {
							parent.children.splice(idx, 1, cardNode);
						}
					}
				} catch (e) {
					console.error(`Failed to fetch OGP for ${href}:`, e);
				}
			}),
		);
	};
}

export async function markdownToHtml(
	content: string | null | undefined,
): Promise<string> {
	if (!content) return "";

	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeOgpLinkCards)
		// コードブロックのシンタックスハイライト。
		// ライト/ダーク両方の色を CSS 変数として埋め、data-theme で切り替える
		// 単一テーマ。サイトのライト/ダークに関わらずコードブロックは暗い配色で、
		// 言語指定のないブロック（.prose pre）と見た目を揃える
		.use(rehypeShiki, { theme: "github-dark" })
		.use(rehypeExternalLinks, {
			target: "_blank",
			rel: ["noopener", "noreferrer"],
		})
		.use(rehypeStringify)
		.process(content);

	return String(file);
}
