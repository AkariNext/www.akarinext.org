import type { AstroCookies } from "astro";
import { AUTH_COOKIE } from "./auth";
import {
	type PbRecord,
	POCKETBASE_URL,
	shapeGame,
	shapePost,
	shapeSeries,
} from "./cms";
import type { CmsGameEntry, CmsPost, CmsSeries } from "./cms-types";
import {
	normalizeSocialId,
	SOCIAL_PROFILES,
	type SocialLink,
	socialPlatformOf,
	socialUrl,
} from "./social-links";

interface PbListResult {
	items?: PbRecord[];
}

export class DashboardError extends Error {
	constructor(
		message: string,
		public readonly status = 500,
	) {
		super(message);
	}
}

function escapeFilter(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function authToken(cookies: AstroCookies): string {
	const token = cookies.get(AUTH_COOKIE)?.value;
	if (!token) throw new DashboardError("ログインし直してください。", 401);
	return token;
}

async function requestPocketBase(
	token: string,
	collection: string,
	options: {
		id?: string;
		method?: "GET" | "POST" | "PATCH" | "DELETE";
		search?: URLSearchParams;
		body?: BodyInit;
	} = {},
): Promise<PbRecord | PbListResult | null> {
	const path = options.id ? `/records/${options.id}` : "/records";
	const query = options.search?.toString();
	const response = await fetch(
		`${POCKETBASE_URL}/api/collections/${collection}${path}${query ? `?${query}` : ""}`,
		{
			method: options.method ?? "GET",
			headers: { Authorization: token },
			body: options.body,
			cache: "no-store",
		},
	);

	if (response.status === 204) return null;
	if (!response.ok) {
		let message = "保存できませんでした。入力内容を確認してください。";
		try {
			const detail = (await response.json()) as {
				message?: string;
				data?: Record<string, { message?: string } | undefined>;
			};
			// PocketBase は原因を data に項目ごとに入れる。
			// message だけだと「Failed to create record.」しか出ず、何が悪いのか分からない
			const fields = Object.entries(detail.data ?? {})
				.map(([name, error]) => `${name}: ${error?.message ?? "不正な値です"}`)
				.join(" / ");
			if (fields) message = fields;
			else if (detail.message) message = detail.message;
		} catch {
			// PocketBase が JSON を返さない場合は一般的な文言を使う。
		}
		throw new DashboardError(message, response.status);
	}
	return (await response.json()) as PbRecord | PbListResult;
}

export function getDashboardToken(cookies: AstroCookies): string {
	return authToken(cookies);
}

/** Cookie 認証を使う書き込みは、自サイトのフォームからだけ受け付ける。 */
export function isSameOriginRequest(request: Request, site?: URL): boolean {
	const source = request.headers.get("origin");
	const fetchSite = request.headers.get("sec-fetch-site");
	if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
		return false;
	}
	if (!source) return true;
	const allowed = new Set(
		[new URL(request.url).origin, site?.origin].filter(Boolean),
	);
	return allowed.has(source);
}

export async function listOwnPosts(
	token: string,
	userId: string,
): Promise<CmsPost[]> {
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "-updated",
		expand: "author,tags,series",
		filter: `author = '${escapeFilter(userId)}'`,
	});
	const result = (await requestPocketBase(token, "posts", {
		search,
	})) as PbListResult;
	return (result.items ?? []).map(shapePost);
}

export async function getOwnPost(
	token: string,
	userId: string,
	postId: string,
): Promise<CmsPost> {
	const search = new URLSearchParams({ expand: "author,tags,series" });
	const record = (await requestPocketBase(token, "posts", {
		id: postId,
		search,
	})) as PbRecord;
	if (String(record.author) !== userId) {
		throw new DashboardError("この記事を編集する権限がありません。", 403);
	}
	return shapePost(record);
}

export async function listOwnGameEntries(
	token: string,
	userId: string,
): Promise<CmsGameEntry[]> {
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "-updated",
		expand: "game",
		filter: `user = '${escapeFilter(userId)}'`,
	});
	const result = (await requestPocketBase(token, "user_games", {
		search,
	})) as PbListResult;
	return (result.items ?? []).flatMap((record) => {
		const game = record.expand?.game;
		if (!game || Array.isArray(game)) return [];
		return [
			{
				id: record.id,
				list: record.list === "finished" ? "finished" : "playing",
				game: shapeGame(game),
				skill_level: String(record.skill_level || "") || undefined,
				impression: String(record.impression || "") || undefined,
				recruitment: String(record.recruitment || "") || undefined,
			} satisfies CmsGameEntry,
		];
	});
}

export async function createRecord(
	token: string,
	collection: "posts" | "user_games" | "media" | "series",
	body: FormData,
): Promise<PbRecord> {
	return (await requestPocketBase(token, collection, {
		method: "POST",
		body,
	})) as PbRecord;
}

export async function updateRecord(
	token: string,
	collection: "posts" | "user_games" | "series" | "users",
	id: string,
	body: FormData,
): Promise<PbRecord> {
	return (await requestPocketBase(token, collection, {
		id,
		method: "PATCH",
		body,
	})) as PbRecord;
}

/** プロフィールの入力を PocketBase の項目へ写す。SNS はここでまとめて扱う */
function profileRecordBody(input: FormData, existing: SocialLink[]): FormData {
	const name = formText(input, "name");
	if (!name) throw new DashboardError("表示名を入力してください。", 400);
	if (name.length > 60) {
		throw new DashboardError("表示名は60文字までです。", 400);
	}

	const username = formText(input, "username");
	if (!/^[a-z0-9](?:[a-z0-9_-]{0,22}[a-z0-9])?$/i.test(username)) {
		throw new DashboardError(
			"ユーザー名は半角英数字とハイフン・アンダースコアで、2〜24文字にしてください。",
			400,
		);
	}

	const bio = formText(input, "bio");
	if (bio.length > 160) {
		throw new DashboardError("自己紹介は160文字までです。", 400);
	}

	const location = formText(input, "location");
	if (location.length > 60) {
		throw new DashboardError("所在地は60文字までです。", 400);
	}

	const body = new FormData();
	body.set("name", name);
	body.set("username", username);
	body.set("bio", bio);
	body.set("location", location);
	// チェックが外れている項目はそもそも送られてこないので、有無で判断する
	body.set("location_public", String(input.get("location_public") !== null));
	body.set("games_public", String(input.get("games_public") !== null));

	const avatar = input.get("avatar");
	if (avatar instanceof File && avatar.size > 0) {
		if (avatar.size > 2 * 1024 * 1024) {
			throw new DashboardError("アイコンは2MBまでです。", 400);
		}
		body.set("avatar", avatar);
	}
	if (input.get("remove_avatar")) body.set("avatar", "");

	body.set("social_links", JSON.stringify(socialLinksFrom(input, existing)));
	return body;
}

/** 入力された ID を検証して、保存する形に整える */
function socialLinksFrom(input: FormData, existing: SocialLink[]): SocialLink[] {
	// 画面で扱えないサービスのぶんは、触らずそのまま残す
	const links: SocialLink[] = existing.filter(
		(link) => socialPlatformOf(link.platform) === null,
	);

	for (const profile of SOCIAL_PROFILES) {
		const raw = formText(input, profile.key);
		if (!raw) continue;
		let id = "";
		try {
			id = normalizeSocialId(profile.key, raw);
		} catch (cause) {
			throw new DashboardError(
				cause instanceof Error
					? cause.message
					: `${profile.label}のIDが正しくありません。`,
				400,
			);
		}
		if (id) {
			links.push({
				platform: profile.key,
				id,
				url: socialUrl(profile.key, id),
			});
		}
	}
	return links;
}

/** プロフィールの保存。SNS も同じフォームから来る */
export async function updateOwnProfile(
	token: string,
	userId: string,
	input: FormData,
	existing: SocialLink[] = [],
): Promise<"profile-saved"> {
	await updateRecord(token, "users", userId, profileRecordBody(input, existing));
	return "profile-saved";
}

/**
 * アカウントの削除。
 *
 * 打ち間違いで消えないよう、ユーザー名を書き写してもらう。
 * PocketBase 側では user_games が一緒に消え、記事は著者が空になって残る。
 */
export async function deleteOwnAccount(
	token: string,
	user: { id: string; username: string },
	input: FormData,
): Promise<void> {
	if (formText(input, "confirm_username") !== user.username) {
		throw new DashboardError("ユーザー名が一致しません。", 400);
	}
	await requestPocketBase(token, "users", { id: user.id, method: "DELETE" });
}

/** SNSはOAuth連携せず、本人が入力した公開IDだけをプロフィールへ保存する。 */
export async function updateOwnSocialLinks(
	token: string,
	userId: string,
	input: FormData,
	existing: SocialLink[] = [],
): Promise<"socials-saved"> {
	const preserved = existing.filter(
		(link) => socialPlatformOf(link.platform) === null,
	);
	const links: SocialLink[] = [...preserved];

	for (const profile of SOCIAL_PROFILES) {
		const raw = formText(input, profile.key);
		let id = "";
		try {
			id = normalizeSocialId(profile.key, raw);
		} catch (cause) {
			throw new DashboardError(
				cause instanceof Error
					? cause.message
					: `${profile.label}のIDが正しくありません。`,
				400,
			);
		}
		if (id) {
			links.push({
				platform: profile.key,
				id,
				url: socialUrl(profile.key, id),
			});
		}
	}

	const body = new FormData();
	body.set("social_links", JSON.stringify(links));
	await updateRecord(token, "users", userId, body);
	return "socials-saved";
}

export async function deleteRecord(
	token: string,
	collection: "posts" | "user_games" | "series",
	id: string,
): Promise<void> {
	await requestPocketBase(token, collection, { id, method: "DELETE" });
}

const GAME_LISTS = new Set(["playing", "finished"]);
const GAME_SKILLS = new Set([
	"",
	"casual",
	"intermediate",
	"expert",
	"better_than_you",
]);
const GAME_IMPRESSIONS = new Set([
	"",
	"obsessed",
	"love",
	"like",
	"meh",
	"give_up",
]);
const GAME_RECRUITMENT = new Set([
	"",
	"looking_for_group",
	"invite_anytime",
	"need_hints",
	"can_teach",
	"discussion_welcome",
]);

function formText(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function gameRecordBody(input: FormData, userId?: string): FormData {
	const list = formText(input, "list");
	const skill = formText(input, "skill_level");
	const impression = formText(input, "impression");
	const recruitment = formText(input, "recruitment");
	if (
		!GAME_LISTS.has(list) ||
		!GAME_SKILLS.has(skill) ||
		!GAME_IMPRESSIONS.has(impression) ||
		!GAME_RECRUITMENT.has(recruitment)
	) {
		throw new DashboardError("ゲームの設定値が正しくありません。", 400);
	}
	const body = new FormData();
	body.set("list", list);
	body.set("skill_level", skill);
	body.set("impression", impression);
	body.set("recruitment", recruitment);
	if (userId) {
		const game = formText(input, "game");
		if (!game) throw new DashboardError("ゲームを選んでください。", 400);
		body.set("user", userId);
		body.set("game", game);
	}
	return body;
}

/** ダッシュボードと互換APIで共用するゲーム棚の保存処理。 */
export async function mutateGameEntry(
	token: string,
	userId: string,
	input: FormData,
): Promise<"game-added" | "game-saved" | "game-deleted"> {
	const action = formText(input, "_action");
	const id = formText(input, "id");
	const entries = await listOwnGameEntries(token, userId);
	const current = id ? entries.find((entry) => entry.id === id) : undefined;

	if (action === "delete") {
		if (!current)
			throw new DashboardError("削除するゲームが見つかりません。", 404);
		await deleteRecord(token, "user_games", id);
		return "game-deleted";
	}
	if (action === "update") {
		if (!current)
			throw new DashboardError("編集するゲームが見つかりません。", 404);
		await updateRecord(token, "user_games", id, gameRecordBody(input));
		return "game-saved";
	}

	const gameId = formText(input, "game");
	if (entries.some((entry) => entry.game.id === gameId))
		throw new DashboardError("このゲームはすでに登録されています。", 400);
	await createRecord(token, "user_games", gameRecordBody(input, userId));
	return "game-added";
}

// ---------------------------------------------------------------------------
// シリーズ
//
// 連載は 1 人のものとは限らない。作成者（owner）に加えて editors を持ち、
// どちらも設定を編集できる。消せるのは owner だけ。
// ---------------------------------------------------------------------------

const SERIES_STATUS = new Set(["draft", "published"]);

/**
 * 記事から選べるシリーズ。
 * 認証付きで引くと listRule により「公開済み + 自分が関わるもの」が返るので、
 * 書きかけのシリーズにも記事を入れられる。
 */
export async function listSelectableSeries(
	token: string,
): Promise<CmsSeries[]> {
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "title",
	});
	const result = (await requestPocketBase(token, "series", {
		search,
	})) as PbListResult;
	return (result.items ?? []).map(shapeSeries);
}

/** 自分が作った、または共同編集者に入っているシリーズ */
export async function listOwnSeries(
	token: string,
	userId: string,
): Promise<CmsSeries[]> {
	const id = escapeFilter(userId);
	const search = new URLSearchParams({
		page: "1",
		perPage: "200",
		sort: "-updated",
		filter: `owner = '${id}' || editors.id ?= '${id}'`,
	});
	const result = (await requestPocketBase(token, "series", {
		search,
	})) as PbListResult;
	return (result.items ?? []).map(shapeSeries);
}

export async function getOwnSeries(
	token: string,
	userId: string,
	seriesId: string,
): Promise<CmsSeries> {
	const record = (await requestPocketBase(token, "series", {
		id: seriesId,
	})) as PbRecord | null;
	if (!record) throw new DashboardError("シリーズが見つかりません。", 404);
	const shaped = shapeSeries(record);
	const canEdit =
		shaped.owner === userId || (shaped.editors ?? []).includes(userId);
	if (!canEdit) throw new DashboardError("このシリーズは編集できません。", 403);
	return shaped;
}

function seriesRecordBody(
	input: FormData,
	options: { ownerId?: string; canManageEditors: boolean },
): FormData {
	const title = formText(input, "title");
	if (!title) throw new DashboardError("タイトルを入力してください。", 400);

	const status = formText(input, "status") || "draft";
	if (!SERIES_STATUS.has(status)) {
		throw new DashboardError("状態が正しくありません。", 400);
	}

	const slug = formText(input, "slug");
	if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		throw new DashboardError(
			"URL名は半角英数字とハイフンで入力してください。",
			400,
		);
	}

	const body = new FormData();
	body.set("title", title);
	body.set("status", status);
	body.set("description", formText(input, "description"));
	// 空なら PocketBase 側の一意制約に触れないよう、ID を後で使う
	if (slug) body.set("slug", slug);

	// 共同編集者を触れるのは owner だけ。
	// 編集者自身が保存したときに body へ含めると、フォームに自分の項目が無いぶん
	// 自分が一覧から外れ、以後そのシリーズを開けなくなる。送らなければ現状が保たれる。
	if (options.canManageEditors) {
		const editors = input
			.getAll("editors")
			.filter(
				(value): value is string =>
					typeof value === "string" &&
					value !== "" &&
					value !== options.ownerId,
			);
		// multipart では複数値を同じ名前で繰り返す。
		// 全部外した場合も反映したいので、空のときは空文字をひとつ送る
		if (editors.length === 0) body.append("editors", "");
		else for (const editor of editors) body.append("editors", editor);
	}

	const cover = input.get("cover_image");
	if (cover instanceof File && cover.size > 0) body.set("cover_image", cover);
	if (input.get("remove_cover")) body.set("cover_image", "");

	if (options.ownerId) body.set("owner", options.ownerId);
	return body;
}

/** シリーズの作成・更新・削除。戻り値は通知に使うキー */
export async function mutateSeries(
	token: string,
	userId: string,
	input: FormData,
): Promise<{ notice: string; id?: string }> {
	const action = formText(input, "_action");
	const id = formText(input, "id");

	if (action === "delete") {
		if (!id) throw new DashboardError("削除対象がわかりません。", 400);
		const current = await getOwnSeries(token, userId, id);
		if (current.owner !== userId) {
			throw new DashboardError("削除できるのは作成者だけです。", 403);
		}
		// 確認のため入力されたタイトルと突き合わせる
		if (formText(input, "confirm_title") !== current.title) {
			throw new DashboardError("タイトルが一致しません。", 400);
		}
		await deleteRecord(token, "series", id);
		return { notice: "series-deleted" };
	}

	if (id) {
		const current = await getOwnSeries(token, userId, id); // 編集権限の確認
		const record = await updateRecord(
			token,
			"series",
			id,
			seriesRecordBody(input, {
				ownerId: current.owner ?? undefined,
				canManageEditors: current.owner === userId,
			}),
		);
		return { notice: "series-saved", id: record.id };
	}

	const body = seriesRecordBody(input, {
		ownerId: userId,
		canManageEditors: true,
	});
	// slug は必須なので、未入力でも何か入れないと作成そのものが弾かれる。
	// レコードの ID は作ってみるまで分からないため、いったん仮の値で作る
	const useIdAsSlug = !formText(input, "slug");
	if (useIdAsSlug) body.set("slug", `series-${crypto.randomUUID()}`);

	const record = await createRecord(token, "series", body);
	// 仮の値のままだと URL が読めないので、ID に置き換える
	if (useIdAsSlug) {
		const patch = new FormData();
		patch.set("slug", record.id);
		await updateRecord(token, "series", record.id, patch);
	}
	return { notice: "series-created", id: record.id };
}
