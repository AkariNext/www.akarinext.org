import preview from "../../../.storybook/preview";
import { member, series } from "../../stories/fixtures";
import SeriesEditor from "./SeriesEditor.astro";

const other = { ...member, id: "u_aki", username: "aki", name: "aki" };

const meta = preview.meta({
	title: "ダッシュボード/SeriesEditor",
	component: SeriesEditor,
	args: {
		action: "/api/dashboard/series",
		members: [other],
		currentUserId: member.id,
	},
	parameters: { layout: "fullscreen" },
});

export default meta;

/** 新しく作るとき。削除も共同編集者も出さない */
export const New = meta.story({});

/** 作った本人が開いたとき。共同編集者を選べる */
export const AsOwner = meta.story({ args: { series } });

/** 共同編集者が開いたとき。編集者の一覧は変えられない */
export const AsEditor = meta.story({
	args: {
		series: { ...series, owner: other.id, editors: [member.id] },
	},
});

export const WithError = meta.story({
	args: { series, error: "URL名は半角英数字とハイフンで入力してください。" },
});
