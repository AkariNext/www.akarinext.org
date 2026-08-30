import preview from "../../../.storybook/preview";
import Button from "./Button.astro";

const meta = preview.meta({
	title: "UI/Button",
	component: Button,
	args: { slots: { default: "ボタン" } },
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "primary", "danger", "bare"],
		},
		size: { control: "inline-radio", options: ["md", "sm"] },
	},
});

export default meta;

export const Default = meta.story({});

/** 主たる操作。ひとつの画面にひとつだけ置く */
export const Primary = meta.story({
	args: { variant: "primary", slots: { default: "保存する" } },
});

/** 元に戻せない操作 */
export const Danger = meta.story({
	args: { variant: "danger", slots: { default: "削除する" } },
});

/** 枠のない補助的な操作 */
export const Bare = meta.story({
	args: { variant: "bare", slots: { default: "キャンセル" } },
});

/** 並びの詰まった場所で使う小さい方 */
export const Small = meta.story({
	args: { size: "sm", slots: { default: "小さいボタン" } },
});

export const Disabled = meta.story({
	args: { disabled: true, slots: { default: "押せない" } },
});

/** href を渡すと <a> になる */
export const AsLink = meta.story({
	args: { href: "/posts", slots: { default: "記事一覧へ" } },
});
