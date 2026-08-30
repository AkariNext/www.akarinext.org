import { definePreview } from "@storybook-astro/framework";
// サイトと同じ見え方にするため、本番と同じ CSS をそのまま読む
import "../src/styles/global.css";

export default definePreview({
	parameters: {
		controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
	},
	// 明暗の切り替えは data-theme で行う。ツールバーから選べるようにする
	globalTypes: {
		theme: {
			description: "配色",
			toolbar: {
				title: "配色",
				icon: "circlehollow",
				items: [
					{ value: "light", title: "ライト" },
					{ value: "dark", title: "ダーク" },
				],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: { theme: "light" },
	decorators: [
		(story, context) => {
			document.documentElement.dataset.theme = String(
				context.globals.theme ?? "light",
			);
			return story();
		},
	],
});
