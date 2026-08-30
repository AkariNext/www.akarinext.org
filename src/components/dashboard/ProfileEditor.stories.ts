import preview from "../../../.storybook/preview";
import { member } from "../../stories/fixtures";
import ProfileEditor from "./ProfileEditor.astro";

const meta = preview.meta({
	title: "ダッシュボード/ProfileEditor",
	component: ProfileEditor,
	args: { user: member },
	parameters: { layout: "fullscreen" },
});

export default meta;

export const Default = meta.story({});

/** 何も書いていないアカウント。プレビューが空でも崩れないか */
export const Empty = meta.story({
	args: {
		user: {
			...member,
			name: null,
			bio: null,
			location: null,
			social_links: [],
			is_staff: false,
		},
	},
});

/** 全部を非公開にした状態 */
export const AllPrivate = meta.story({
	args: { user: { ...member, games_public: false, location_public: false } },
});

export const Saved = meta.story({ args: { notice: "profile-saved" } });

export const WithError = meta.story({
	args: { error: "ユーザー名が既に使われています。" },
});
