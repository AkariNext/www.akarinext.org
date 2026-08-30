import type { StorybookConfig } from "@storybook-astro/framework";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx|js|jsx)"],
	framework: {
		name: "@storybook-astro/framework",
		options: {},
	},
	viteFinal: (config) => {
		// .astro の <script> は TypeScript で書いてある。拡張子が付かないので
		// そのままだと型注釈が残り、`querySelector<HTMLElement>` の `<` が
		// 比較演算子として読まれて落ちる。ts として扱うよう指定する
		config.esbuild = { ...config.esbuild, loader: "ts" };
		return config;
	},
};

export default config;
