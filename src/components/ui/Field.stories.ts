import preview from "../../../.storybook/preview";
import Field from "./Field.astro";

const meta = preview.meta({
	title: "UI/Field",
	component: Field,
	args: { label: "表示名" },
});

export default meta;

export const Default = meta.story({
	args: { slots: { default: '<input name="name" value="yupix" />' } },
});

/** 入力の下に補足を出す */
export const WithHelp = meta.story({
	args: {
		label: "ユーザー名",
		help: "半角英数字とハイフン・アンダースコアで 2〜24 文字",
		slots: { default: '<input name="username" value="yupix" />' },
	},
});

/** ラベルの右に文字数を出す */
export const WithCounter = meta.story({
	args: {
		label: "自己紹介",
		meta: "60 / 160",
		slots: {
			default:
				'<textarea rows="4">AkariNext の運営。インフラの引っ越しとサーバー監視を担当しています。</textarea>',
		},
	},
});

/** 短い入力を横に広げない */
export const Narrow = meta.story({
	args: {
		label: "所在地",
		narrow: true,
		slots: { default: '<input name="location" value="東京" />' },
	},
});
