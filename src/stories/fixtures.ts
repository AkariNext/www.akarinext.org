/**
 * Storybook で使う見本のデータ。
 *
 * 実物は PocketBase から来るが、Storybook は CMS に繋がない。
 * 型は本物と同じものを使い、抜けや型違いに気づけるようにしておく。
 */
import type { CmsMember, CmsPost, CmsSeries } from "../lib/cms-types";

export const member: CmsMember = {
	id: "u_yupix",
	username: "yupix",
	name: "yupix",
	avatar: null,
	is_staff: true,
	staff_title: null,
	bio: "AkariNext の運営。インフラの引っ越しとサーバー監視を担当しています。",
	location: "東京",
	location_public: true,
	games_public: true,
	social_links: [
		{ platform: "github", id: "yupix", url: "https://github.com/yupix" },
	],
	playing_games: [],
	finished_games: [],
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-08-01T00:00:00Z",
};

export const post: CmsPost = {
	id: "p_blender",
	title: "Blender のお勉強 1",
	slug: "blender-1",
	content:
		"オブジェクトの基本操作から始めます。選択と削除、操作のやり直し、それに視点の動かし方まで一通り触れました。",
	image: null,
	published_date: "2026-03-01T00:00:00Z",
	category: "tech",
	status: "published",
	is_spoiler: false,
	author: member,
	tags: [
		{ id: "t_tech", name: "tech", slug: "tech", createdAt: "", updatedAt: "" },
	],
	series: null,
	series_order: null,
	createdAt: "2026-03-01T00:00:00Z",
	updatedAt: "2026-03-01T00:00:00Z",
};

/** ネタバレ扱いの記事。本文の代わりに断り書きが出る */
export const spoilerPost: CmsPost = {
	...post,
	id: "p_spoiler",
	title: "超かぐや姫のために徳島まで行った話",
	slug: "tokushima",
	is_spoiler: true,
};

/** 表紙のある記事 */
export const postWithImage: CmsPost = {
	...post,
	id: "p_image",
	title: "最近開発してて思うこと",
	slug: "recent-thoughts",
	image: { url: "https://picsum.photos/seed/akarinext/800/450" },
};

export const series: CmsSeries = {
	id: "s_blender",
	title: "Blender のお勉強",
	slug: "blender",
	description: "触ったことのないところから始めて、作れるようになるまでの記録。",
	cover_image: null,
	status: "published",
	owner: member.id,
	editors: [],
	createdAt: "2026-03-01T00:00:00Z",
	updatedAt: "2026-08-01T00:00:00Z",
};
