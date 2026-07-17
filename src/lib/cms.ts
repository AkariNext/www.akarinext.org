/**
 * PocketBase REST API クライアント
 * 環境変数: PUBLIC_POCKETBASE_URL (例: http://localhost:8090)
 *
 * PocketBase の生レコード（file フィールドはファイル名、リレーションは expand 内）を
 * ページ側が扱いやすい形（CmsPost / CmsMember など）に整形して返す。
 */

import { Code2, Gamepad2, MessageCircle } from "lucide-astro";
import type {
	CmsAnnouncement,
	CmsGame,
	CmsGameEntry,
	CmsGameServer,
	CmsMedia,
	CmsMember,
	CmsPost,
	CmsSettings,
	CmsTag,
} from "./cms-types";

const POCKETBASE_URL = (
	import.meta.env.PUBLIC_POCKETBASE_URL || "http://localhost:8090"
).replace(/\/$/, "");

// ---------------------------------------------------------------------------
// 低レベルヘルパー
// ---------------------------------------------------------------------------

/** PocketBase の生レコード */
interface PbRecord {
	id: string;
	collectionName?: string;
	created?: string;
	updated?: string;
	expand?: Record<string, PbRecord | PbRecord[]>;
	[key: string]: unknown;
}

interface PbListResult {
	items: PbRecord[];
}

export interface CmsQuery {
	sort?: string | string[];
	limit?: number;
	where?: Record<string, unknown>;
}

/** ソートキーを PocketBase のフィールド名に変換 */
function mapSortField(field: string): string {
	const desc = field.startsWith("-");
	const name = desc ? field.slice(1) : field;
	const mapped =
		name === "createdAt" ? "created" : name === "updatedAt" ? "updated" : name;
	return desc ? `-${mapped}` : mapped;
}

/** where（{ field: { equals: value } } 形式）を PocketBase の filter 式に変換 */
function buildFilter(where?: Record<string, unknown>): string | undefined {
	if (!where) return undefined;
	const parts: string[] = [];
	for (const [key, val] of Object.entries(where)) {
		if (val && typeof val === "object" && "equals" in val) {
			const raw = (val as { equals: unknown }).equals;
			if (typeof raw === "boolean" || typeof raw === "number") {
				parts.push(`${key} = ${raw}`);
			} else {
				parts.push(`${key} = '${String(raw).replace(/'/g, "\\'")}'`);
			}
		}
	}
	return parts.length > 0 ? parts.join(" && ") : undefined;
}

async function pbFetchList(
	collection: string,
	options: CmsQuery & { expand?: string } = {},
): Promise<PbRecord[]> {
	const search = new URLSearchParams();
	search.set("page", "1");
	search.set("perPage", String(options.limit ?? 200));
	search.set("skipTotal", "1");
	if (options.sort) {
		const sortArr = Array.isArray(options.sort) ? options.sort : [options.sort];
		search.set("sort", sortArr.map(mapSortField).join(","));
	}
	const filter = buildFilter(options.where);
	if (filter) search.set("filter", filter);
	if (options.expand) search.set("expand", options.expand);

	const url = `${POCKETBASE_URL}/api/collections/${collection}/records?${search}`;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) {
		throw new Error(
			`CMS API Error: ${res.status} ${res.statusText} (${collection})`,
		);
	}
	const data = (await res.json()) as PbListResult;
	return Array.isArray(data.items) ? data.items : [];
}

/** file フィールド（ファイル名）を表示用のメディアオブジェクトに変換 */
function toMedia(record: PbRecord, field: string): CmsMedia | null {
	const filename = record[field];
	if (typeof filename !== "string" || filename === "") return null;
	const collection = record.collectionName || "";
	return {
		url: `${POCKETBASE_URL}/api/files/${collection}/${record.id}/${filename}`,
		name: filename,
	};
}

function timestamps(record: PbRecord): {
	createdAt: string;
	updatedAt: string;
} {
	return {
		createdAt: String(record.created || ""),
		updatedAt: String(record.updated || record.created || ""),
	};
}

// ---------------------------------------------------------------------------
// レコード → CMS 型への整形
// ---------------------------------------------------------------------------

function shapeGame(record: PbRecord): CmsGame {
	return {
		id: record.id,
		name: String(record.name ?? ""),
		slug: String(record.slug ?? ""),
		description: (record.description as string) || null,
		cover_image: toMedia(record, "cover_image"),
		...timestamps(record),
	};
}

function shapeTag(record: PbRecord): CmsTag {
	return {
		id: record.id,
		name: String(record.name ?? ""),
		slug: String(record.slug ?? ""),
		...timestamps(record),
	};
}

function shapeMember(record: PbRecord): CmsMember {
	return {
		id: record.id,
		username: String(record.username ?? record.name ?? ""),
		name: (record.name as string) || null,
		avatar: toMedia(record, "avatar"),
		is_staff: Boolean(record.is_staff),
		staff_title: (record.staff_title as string) || null,
		bio: (record.bio as string) || null,
		social_links: Array.isArray(record.social_links)
			? (record.social_links as { platform?: string; url?: string }[])
			: [],
		playing_games: [],
		finished_games: [],
		...timestamps(record),
	};
}

function shapePost(record: PbRecord): CmsPost {
	const author = record.expand?.author as PbRecord | undefined;
	const tags = record.expand?.tags as PbRecord[] | undefined;
	return {
		id: record.id,
		title: String(record.title ?? ""),
		slug: (record.slug as string) || null,
		content: (record.content as string) || null,
		author: author ? shapeMember(author) : null,
		published_date: (record.published_date as string) || null,
		category: String(record.category ?? "misc"),
		tags: Array.isArray(tags) ? tags.map(shapeTag) : [],
		image: toMedia(record, "image"),
		is_spoiler: Boolean(record.is_spoiler),
		spoiler_warning: (record.spoiler_warning as string) || null,
		...timestamps(record),
	};
}

function shapeAnnouncement(record: PbRecord): CmsAnnouncement {
	return {
		id: record.id,
		title: String(record.title ?? ""),
		content: (record.content as string) || null,
		published_date: (record.published_date as string) || null,
		...timestamps(record),
	};
}

function shapeGameServer(record: PbRecord): CmsGameServer {
	return {
		id: record.id,
		name: String(record.name ?? ""),
		type: (record.type as CmsGameServer["type"]) || "other",
		ip: String(record.ip ?? ""),
		port: Number(record.port ?? 0),
		protocol: (record.protocol as string) || null,
		description: (record.description as string) || null,
		...timestamps(record),
	};
}

function shapeSettings(record: PbRecord): CmsSettings {
	return {
		id: record.id,
		site_title: (record.site_title as string) || null,
		site_description: (record.site_description as string) || null,
		site_logo: toMedia(record, "site_logo"),
	};
}

// ---------------------------------------------------------------------------
// コレクションごとの取得ロジック
// ---------------------------------------------------------------------------

/** メンバー一覧を取得し、user_games からプレイ中／クリア済みゲームを紐付ける */
async function fetchMembers(query: CmsQuery): Promise<CmsMember[]> {
	const [users, entries] = await Promise.all([
		pbFetchList("users", query),
		pbFetchList("user_games", { limit: 500, expand: "game" }),
	]);

	const members = users.map(shapeMember);
	const byId = new Map(members.map((m) => [m.id, m]));

	for (const entry of entries) {
		const member = byId.get(String(entry.user));
		const gameRecord = entry.expand?.game as PbRecord | undefined;
		if (!member || !gameRecord) continue;
		const shaped: CmsGameEntry = {
			game: shapeGame(gameRecord),
			skill_level: (entry.skill_level as string) || undefined,
			impression: (entry.impression as string) || undefined,
			recruitment: (entry.recruitment as string) || undefined,
		};
		if (entry.list === "finished") {
			member.finished_games?.push(shaped);
		} else {
			member.playing_games?.push(shaped);
		}
	}
	return members;
}

type Shaper = (record: PbRecord) => unknown;

const collectionConfig: Record<
	string,
	{ collection: string; expand?: string; shape: Shaper }
> = {
	posts: { collection: "posts", expand: "author,tags", shape: shapePost },
	announcements: { collection: "announcements", shape: shapeAnnouncement },
	games: { collection: "games", shape: shapeGame },
	tags: { collection: "tags", shape: shapeTag },
	"game-servers": { collection: "game_servers", shape: shapeGameServer },
};

export const cmsClient = {
	items: <T>(collection: string) => ({
		readByQuery: async (query: CmsQuery = {}): Promise<T[]> => {
			if (collection === "users" || collection === "authors") {
				return (await fetchMembers(query)) as T[];
			}
			const config = collectionConfig[collection];
			if (!config) throw new Error(`Unknown CMS collection: ${collection}`);
			const records = await pbFetchList(config.collection, {
				...query,
				expand: config.expand,
			});
			return records.map(config.shape) as T[];
		},
	}),
	singleton: <T>(slug: string) => ({
		read: async (): Promise<T> => {
			if (slug !== "settings")
				throw new Error(`Unknown CMS singleton: ${slug}`);
			const records = await pbFetchList("settings", { limit: 1 });
			if (records.length === 0)
				throw new Error("CMS settings record not found");
			return shapeSettings(records[0]) as T;
		},
	}),
};

/** メディアオブジェクトから表示用 URL を取得 */
export function getMediaUrl(
	media: CmsMedia | { url?: string } | null | undefined,
): string | undefined {
	if (!media || !media.url) return undefined;
	return media.url.startsWith("http")
		? media.url
		: `${POCKETBASE_URL}${media.url}`;
}

/**
 * カテゴリー情報を取得
 */
export const getCategoryInfo = (cat: string) => {
	switch (cat?.toLowerCase()) {
		case "tech":
			return { icon: Code2, color: "#3b82f6", label: "技術・開発" };
		case "game":
			return { icon: Gamepad2, color: "#10b981", label: "ゲーム" };
		default:
			return { icon: MessageCircle, color: "#f59e0b", label: "雑談" };
	}
};

export type {
	CmsMedia,
	CmsSettings,
	CmsGame,
	CmsGameEntry,
	CmsMember,
	CmsTag,
	CmsPost,
	CmsAnnouncement,
	CmsGameServer,
};
