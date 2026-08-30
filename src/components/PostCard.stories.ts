import preview from "../../.storybook/preview";
import { post, postWithImage, spoilerPost } from "../stories/fixtures";
import PostCard from "./PostCard.astro";

const meta = preview.meta({
	title: "記事/PostCard",
	component: PostCard,
	args: { post },
});

export default meta;

export const Default = meta.story({});

/** 表紙がある場合 */
export const WithImage = meta.story({ args: { post: postWithImage } });

/** ネタバレ扱い。本文の代わりに断り書きが出る */
export const Spoiler = meta.story({ args: { post: spoilerPost } });

/** 表題が長いと何行になるか */
export const LongTitle = meta.story({
	args: {
		post: {
			...post,
			title:
				"Blender を触ったことのないところから始めて、ひととおり作れるようになるまでの長い記録",
		},
	},
});
