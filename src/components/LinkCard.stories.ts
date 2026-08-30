import preview from "../../.storybook/preview";
import LinkCard from "./LinkCard.astro";

const meta = preview.meta({
	title: "記事/LinkCard",
	component: LinkCard,
});

export default meta;

/**
 * YouTube の URL は埋め込みプレイヤーになる。
 *
 * これ以外の URL は OGP を取りに行くので、ここでは扱わない。
 * 外に繋がるかどうかで見え方が変わってしまい、確認の役に立たない。
 */
export const YouTube = meta.story({
	args: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
});
