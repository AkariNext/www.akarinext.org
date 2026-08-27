/**
 * PocketBase REST API クライアント
 *
 * 環境変数:
 * - POCKETBASE_URL   … API の接続先。サーバー側でしか読まないので、
 *                       コンテナ内部のホスト名（例: http://pocketbase:8090）を指定でき、
 *                       PocketBase を外部公開しないまま運用できる。
 * - PUBLIC_MEDIA_BASE … ブラウザが画像を取りに行くベース URL。
 *                       リバースプロキシで `/api/files/*` を PocketBase に転送する構成では
 *                       `/api/files` を指定する（パスを揃えているので書き換えは不要）。
 *
 * どちらも未設定なら、旧来の PUBLIC_POCKETBASE_URL にフォールバックする。
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
	CmsSeries,
	CmsSettings,
	CmsTag,
} from "./cms-types";

/** 末尾のスラッシュを落とす */
function trimSlash(url: string): string {
	return url.replace(/\/$/, "");
}

/**
 * 環境変数を読む。ランタイム（process.env）を優先し、
 * ビルド時に埋め込まれた import.meta.env にフォールバックする。
 */
function readEnv(key: string): string | undefined {
	const runtime = globalThis.process?.env?.[key];
	if (runtime) return runtime;
	const build = (import.meta.env as Record<string, string | undefined>)[key];
	return build || undefined;
}

/** API の接続先。サーバー側でのみ使う */
export const POCKETBASE_URL = trimSlash(
	readEnv("POCKETBASE_URL") ??
		readEnv("PUBLIC_POCKETBASE_URL") ??
		"http://localhost:8090",
);

/**
 * ブラウザ向けの画像ベース URL。
 * PUBLIC_MEDIA_BASE 未設定なら、PocketBase を直接指す従来の絶対 URL になる。
 */
const MEDIA_BASE = trimSlash(
	import.meta.env.PUBLIC_MEDIA_BASE ?? `${POCKETBASE_URL}/api/files`,
);

// ---------------------------------------------------------------------------
// 低レベルヘルパー
// ---------------------------------------------------------------------------

/** PocketBase の生レコード */
export interface PbRecord {
	id: string;
	collectionName?: string;
	created?: string;
	updated?: string;
	expand?: Record<string, PbRecord | PbRecord[]>;
	[key: string]: unknown;
}

interface PbListResult {
	items: PbRecord[];
	page?: number;
	perPage?: number;
	totalItems?: number;
	totalPages?: number;
}

interface PbPageResult {
	items: PbRecord[];
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
}

export interface CmsQuery {
	sort?: string | string[];
	limit?: number;
	where?: Record<string, unknown>;
}

export interface CmsPage<T> {
	items: T[];
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
}

export interface CmsPageQuery extends CmsQuery {
	page?: number;
	perPage?: number;
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
		} else if (val && typeof val === "object" && "contains" in val) {
			const raw = (val as { contains: unknown }).contains;
			parts.push(`${key} ?= '${String(raw).replace(/'/g, "\\'")}'`);
		}
	}
	return parts.length > 0 ? parts.join(" && ") : undefined;
}

async function pbFetchPage(
	collection: string,
	options: CmsPageQuery & { expand?: string } = {},
): Promise<PbPageResult> {
	const search = new URLSearchParams();
	search.set("page", String(Math.max(1, options.page ?? 1)));
	search.set("perPage", String(options.perPage ?? options.limit ?? 12));
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
	return {
		items: Array.isArray(data.items) ? data.items : [],
		page: Number(data.page || options.page || 1),
		perPage: Number(data.perPage || options.perPage || options.limit || 12),
		totalItems: Number(data.totalItems || 0),
		totalPages: Number(data.totalPages || 0),
	};
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
		url: `${MEDIA_BASE}/${collection}/${record.id}/${filename}`,
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

export function shapeGame(record: PbRecord): CmsGame {
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

function shapeSeries(record: PbRecord): CmsSeries {
	return {
		id: record.id,
		title: String(record.title ?? ""),
		slug: String(record.slug ?? ""),
		description: (record.description as string) || null,
		cover_image: toMedia(record, "cover_image"),
		...timestamps(record),
	};
}

export function shapeMember(record: PbRecord): CmsMember {
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

export function shapePost(record: PbRecord): CmsPost {
	const author = record.expand?.author as PbRecord | undefined;
	const tags = record.expand?.tags as PbRecord[] | undefined;
	const series = record.expand?.series as PbRecord | undefined;
	return {
		id: record.id,
		title: String(record.title ?? ""),
		slug: (record.slug as string) || null,
		content: (record.content as string) || null,
		author: author ? shapeMember(author) : null,
		published_date: (record.published_date as string) || null,
		category: String(record.category ?? "misc"),
		tags: Array.isArray(tags) ? tags.map(shapeTag) : [],
		series: series ? shapeSeries(series) : null,
		series_order:
			typeof record.series_order === "number" ? record.series_order : null,
		image: toMedia(record, "image"),
		is_spoiler: Boolean(record.is_spoiler),
		spoiler_warning: (record.spoiler_warning as string) || null,
		status: record.status === "draft" ? "draft" : "published",
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
			id: entry.id,
			list: entry.list === "finished" ? "finished" : "playing",
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
	posts: {
		collection: "posts",
		expand: "author,tags,series",
		shape: shapePost,
	},
	announcements: { collection: "announcements", shape: shapeAnnouncement },
	games: { collection: "games", shape: shapeGame },
	tags: { collection: "tags", shape: shapeTag },
	series: { collection: "series", shape: shapeSeries },
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
		readPage: async (query: CmsPageQuery = {}): Promise<CmsPage<T>> => {
			const config = collectionConfig[collection];
			if (!config || collection === "users" || collection === "authors") {
				throw new Error(
					`Pagination is not supported for collection: ${collection}`,
				);
			}
			const result = await pbFetchPage(config.collection, {
				...query,
				expand: config.expand,
			});
			return {
				...result,
				items: result.items.map(config.shape) as T[],
			};
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
	// toMedia() が組み立てた絶対 URL / ルート相対パスはそのまま使う
	if (media.url.startsWith("http") || media.url.startsWith("/"))
		return media.url;
	return `${MEDIA_BASE}/${media.url}`;
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
	CmsSeries,
	CmsAnnouncement,
	CmsGameServer,
};
