import preview from "../../../.storybook/preview";
import Message from "./Message.astro";

const meta = preview.meta({
	title: "UI/Message",
	component: Message,
	argTypes: { tone: { control: "inline-radio", options: ["notice", "error"] } },
});

export default meta;

/** 保存できたときなど。読み上げは割り込まない */
export const Notice = meta.story({
	args: { slots: { default: "保存しました。" } },
});

/** 入力の誤りや失敗。読み上げに割り込ませる */
export const ErrorTone = meta.story({
	name: "Error",
	args: {
		tone: "error",
		slots: { default: "タイトルを入力してください。" },
	},
});

/** 長い文でも読めるか */
export const LongText = meta.story({
	args: {
		tone: "error",
		slots: {
			default:
				"ユーザー名は半角英数字とハイフン・アンダースコアで、2〜24文字にしてください。",
		},
	},
});
