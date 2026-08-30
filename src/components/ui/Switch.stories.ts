import preview from "../../../.storybook/preview";
import Switch from "./Switch.astro";

const meta = preview.meta({
	title: "UI/Switch",
	component: Switch,
	args: { name: "games_public" },
});

export default meta;

export const On = meta.story({ args: { checked: true } });

export const Off = meta.story({ args: { checked: false } });

/** 呼び名は場所に合わせて変えられる */
export const CustomLabels = meta.story({
	args: { checked: true, onLabel: "有効", offLabel: "無効" },
});
