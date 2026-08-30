import preview from "../../../.storybook/preview";
import { post, series } from "../../stories/fixtures";
import PostEditor from "./PostEditor.astro";

const tags = [
	{ id: "t_tech", name: "tech", slug: "tech", createdAt: "", updatedAt: "" },
	{ id: "t_misc", name: "misc", slug: "misc", createdAt: "", updatedAt: "" },
];

const meta = preview.meta({
	title: "ダッシュボード/PostEditor",
	component: PostEditor,
	args: {
		action: "/api/dashboard/posts",
		tags,
		series: [series],
	},
	parameters: { layout: "fullscreen" },
});

export default meta;

/** 新しく書くとき */
export const New = meta.story({});

/** 書いたものを開き直したとき */
export const Editing = meta.story({ args: { post } });

/** 連載に入れてある記事 */
export const InSeries = meta.story({
	args: { post: { ...post, series, series_order: 1 } },
});

export const WithError = meta.story({
	args: { post, error: "タイトルを入力してください。" },
});
