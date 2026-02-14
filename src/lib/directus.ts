import {
	createDirectus,
	readItem,
	readItems,
	readSingleton,
	rest,
} from "@directus/sdk";

export type Author = {
	id: number;
	name: string;
	avatar?: string;
	bio?: string;
	social_links?: { platform: string; url: string }[];
	is_staff?: boolean;
	staff_title?: string;
};

export type Post = {
	id: number;
	title: string;
	slug: string;
	content: string;
	author: Author;
	published_date: string;
	image?: string;
	category: "tech" | "game" | "misc";
	tags?: string[];
	status: "draft" | "published";
};

export type Announcement = {
	id: number;
	title: string;
	content: string;
	published_date: string;
	status: "draft" | "published";
};

export type Game = {
	id: number;
	name: string;
	slug: string;
	description?: string;
	cover_image?: string;
};

export type GamePlayer = {
	id: number;
	user: Author;
	game: Game;
	started_at: string;
	status: "playing" | "finished";
};

export type GameServer = {
	id: number;
	name: string;
	type: "minecraft" | "other";
	ip: string;
	port: number;
	protocol: string;
	description?: string;
	status: "published" | "draft";
};

export type GlobalSettings = {
	site_title: string;
	site_description: string;
	site_logo?: string;
};

export type Schema = {
	posts: Post[];
	announcements: Announcement[];
	games: Game[];
	game_players: GamePlayer[];
	game_servers: GameServer[];
	authors: Author[];
	global: GlobalSettings;
};

const directusUrl =
	import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

/** ビルド時に Directus への fetch をスキップ（403 や接続不可時に使用） */
export const skipDirectusFetch =
	import.meta.env.PUBLIC_SKIP_DIRECTUS_BUILD === "true" ||
	!import.meta.env.PUBLIC_DIRECTUS_URL;

export const directus = createDirectus<Schema>(directusUrl).with(rest());

export { readItem, readItems, readSingleton };
