/**
 * CMS（PocketBase）レスポンス用の型定義
 * PocketBase の生レコードは src/lib/cms.ts でこの形に整形される
 */

export interface CmsMedia {
	/** 表示用の絶対 URL */
	url: string;
	name?: string;
	alternativeText?: string | null;
}

export interface CmsSettings {
	id: string;
	site_title?: string | null;
	site_description?: string | null;
	site_logo?: CmsMedia | null;
}

export interface CmsGame {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	cover_image?: CmsMedia | null;
	createdAt: string;
	updatedAt: string;
}

export type GameListKind = "playing" | "finished";

export interface CmsGameEntry {
	game: CmsGame;
	skill_level?: string;
	impression?: string;
	recruitment?: string;
}

/** コミュニティメンバー（投稿の作者） */
export interface CmsMember {
	id: string;
	username: string;
	name?: string | null;
	avatar?: CmsMedia | null;
	is_staff?: boolean;
	staff_title?: string | null;
	bio?: string | null;
	social_links?: { platform?: string; url?: string }[];
	playing_games?: CmsGameEntry[];
	finished_games?: CmsGameEntry[];
	createdAt: string;
	updatedAt: string;
}

export interface CmsTag {
	id: string;
	name: string;
	slug: string;
	createdAt: string;
	updatedAt: string;
}

export interface CmsPost {
	id: string;
	title: string;
	slug?: string | null;
	/** Markdown 本文 */
	content?: string | null;
	author?: CmsMember | null;
	published_date?: string | null;
	category: string;
	tags?: CmsTag[] | null;
	image?: CmsMedia | null;
	is_spoiler?: boolean;
	spoiler_warning?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CmsAnnouncement {
	id: string;
	title: string;
	content?: string | null;
	published_date?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CmsGameServer {
	id: string;
	name: string;
	type: "minecraft" | "web" | "other";
	ip: string;
	port: number;
	protocol?: string | null;
	description?: string | null;
	createdAt: string;
	updatedAt: string;
}
