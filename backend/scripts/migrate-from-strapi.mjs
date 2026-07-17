/**
 * Strapi → PocketBase データ移行スクリプト
 *
 * 使い方:
 *   STRAPI_URL=https://old-strapi.example.com \
 *   POCKETBASE_URL=http://localhost:8090 \
 *   PB_SUPERUSER_EMAIL=admin@example.com \
 *   PB_SUPERUSER_PASSWORD=xxxx \
 *   node scripts/migrate-from-strapi.mjs
 *
 * オプション:
 *   STRAPI_API_TOKEN … 指定すると下書き（draft）の投稿・お知らせも移行する
 *
 * 注意:
 *   - ユーザーのパスワードは移行できないため、ランダム値で作成される。
 *     移行後に PocketBase の管理画面から再設定すること。
 *   - 同じ slug / username のレコードが既にある場合はスキップする（再実行可能）。
 */

const STRAPI_URL = (process.env.STRAPI_URL || "http://localhost:1337").replace(
	/\/$/,
	"",
);
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";
const PB_URL = (process.env.POCKETBASE_URL || "http://localhost:8090").replace(
	/\/$/,
	"",
);
const PB_EMAIL = process.env.PB_SUPERUSER_EMAIL;
const PB_PASSWORD = process.env.PB_SUPERUSER_PASSWORD;

if (!PB_EMAIL || !PB_PASSWORD) {
	console.error(
		"PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD を設定してください。",
	);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// API ヘルパー
// ---------------------------------------------------------------------------

async function strapiGet(path, query = "") {
	const headers = STRAPI_API_TOKEN
		? { Authorization: `Bearer ${STRAPI_API_TOKEN}` }
		: {};
	const res = await fetch(`${STRAPI_URL}${path}${query ? `?${query}` : ""}`, {
		headers,
	});
	if (!res.ok) throw new Error(`Strapi GET ${path} -> ${res.status}`);
	return res.json();
}

let pbToken = "";

async function pbRequest(path, method = "GET", body) {
	const isForm = body instanceof FormData;
	const res = await fetch(`${PB_URL}${path}`, {
		method,
		headers: {
			...(pbToken ? { Authorization: pbToken } : {}),
			...(body && !isForm ? { "Content-Type": "application/json" } : {}),
		},
		body: isForm ? body : body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(
			`PocketBase ${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`,
		);
	}
	return data;
}

async function pbFindFirst(collection, filter) {
	const data = await pbRequest(
		`/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`,
	);
	return data.items?.[0] || null;
}

/** Strapi のメディアをダウンロードして FormData に追加する */
async function appendMedia(form, field, media) {
	if (!media?.url) return;
	const url = media.url.startsWith("http")
		? media.url
		: `${STRAPI_URL}${media.url}`;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const blob = await res.blob();
		form.append(field, blob, media.name || url.split("/").pop() || "file");
	} catch (err) {
		console.warn(`  ! メディアの取得に失敗（スキップ）: ${url}`, err.message);
	}
}

function randomPassword() {
	return [...crypto.getRandomValues(new Uint8Array(24))]
		.map((b) => b.toString(36).padStart(2, "0"))
		.join("")
		.slice(0, 30);
}

// ---------------------------------------------------------------------------
// 移行処理
// ---------------------------------------------------------------------------

const auth = await pbRequest(
	"/api/collections/_superusers/auth-with-password",
	"POST",
	{
		identity: PB_EMAIL,
		password: PB_PASSWORD,
	},
);
pbToken = auth.token;
console.log(`PocketBase (${PB_URL}) に接続しました。`);

// Strapi ID -> PocketBase ID の対応表
const idMap = { users: new Map(), games: new Map(), tags: new Map() };

// --- games ---
console.log("\n[1/7] games を移行中...");
{
	const data = await strapiGet(
		"/api/games",
		"populate[cover_image]=true&pagination[pageSize]=100",
	);
	for (const game of data.data || []) {
		let existing = await pbFindFirst("games", `slug = '${game.slug}'`);
		if (!existing) {
			const form = new FormData();
			form.append("name", game.name || "");
			form.append("slug", game.slug || "");
			if (game.description) form.append("description", game.description);
			await appendMedia(form, "cover_image", game.cover_image);
			existing = await pbRequest(
				"/api/collections/games/records",
				"POST",
				form,
			);
			console.log(`  + ${game.name}`);
		}
		idMap.games.set(game.id, existing.id);
	}
}

// --- tags ---
console.log("[2/7] tags を移行中...");
{
	const data = await strapiGet("/api/tags", "pagination[pageSize]=100");
	for (const tag of data.data || []) {
		let existing = await pbFindFirst("tags", `slug = '${tag.slug}'`);
		if (!existing) {
			existing = await pbRequest("/api/collections/tags/records", "POST", {
				name: tag.name,
				slug: tag.slug,
			});
			console.log(`  + ${tag.name}`);
		}
		idMap.tags.set(tag.id, existing.id);
	}
}

// --- users ---
console.log("[3/7] users を移行中...");
{
	const users = await strapiGet(
		"/api/users",
		"populate[avatar]=true&populate[social_links]=true" +
			"&populate[playing_games][populate][game]=true&populate[finished_games][populate][game]=true",
	);
	for (const user of users || []) {
		let existing = await pbFindFirst("users", `username = '${user.username}'`);
		if (!existing) {
			const password = randomPassword();
			const form = new FormData();
			form.append("username", user.username);
			form.append("email", user.email || `${user.username}@example.invalid`);
			form.append("password", password);
			form.append("passwordConfirm", password);
			form.append("verified", "true");
			if (user.name) form.append("name", user.name);
			if (user.bio) form.append("bio", user.bio);
			form.append("is_staff", String(Boolean(user.is_staff)));
			if (user.staff_title) form.append("staff_title", user.staff_title);
			if (Array.isArray(user.social_links)) {
				form.append(
					"social_links",
					JSON.stringify(
						user.social_links.map(({ platform, url }) => ({ platform, url })),
					),
				);
			}
			await appendMedia(form, "avatar", user.avatar);
			existing = await pbRequest(
				"/api/collections/users/records",
				"POST",
				form,
			);
			console.log(`  + ${user.username}（パスワードは要再設定）`);
		}
		idMap.users.set(user.id, existing.id);

		// playing_games / finished_games -> user_games
		for (const [list, entries] of [
			["playing", user.playing_games || []],
			["finished", user.finished_games || []],
		]) {
			for (const entry of entries) {
				const gameId = idMap.games.get(entry.game?.id);
				if (!gameId) continue;
				const dup = await pbFindFirst(
					"user_games",
					`user = '${existing.id}' && game = '${gameId}' && list = '${list}'`,
				);
				if (dup) continue;
				await pbRequest("/api/collections/user_games/records", "POST", {
					user: existing.id,
					game: gameId,
					list,
					skill_level: entry.skill_level || "",
					impression: entry.impression || "",
					recruitment: entry.recruitment || "",
				});
			}
		}
	}
}

// --- posts ---
console.log("[4/7] posts を移行中...");
async function migratePosts(status) {
	const query =
		"populate[author]=true&populate[image]=true&populate[tags]=true&pagination[pageSize]=100" +
		"&sort=createdAt:asc" +
		(status === "draft" ? "&status=draft" : "");
	const data = await strapiGet("/api/posts", query);
	for (const post of data.data || []) {
		const slug = post.slug || post.documentId || String(post.id);
		if (await pbFindFirst("posts", `slug = '${slug}'`)) continue;
		const form = new FormData();
		form.append("title", post.title || "");
		form.append("slug", slug);
		if (post.content) form.append("content", post.content);
		if (post.published_date) form.append("published_date", post.published_date);
		form.append("category", post.category || "misc");
		form.append("is_spoiler", String(Boolean(post.is_spoiler)));
		if (post.spoiler_warning)
			form.append("spoiler_warning", post.spoiler_warning);
		form.append("status", status);
		const authorId = idMap.users.get(post.author?.id);
		if (authorId) form.append("author", authorId);
		for (const tag of post.tags || []) {
			const tagId = idMap.tags.get(tag.id);
			if (tagId) form.append("tags", tagId);
		}
		await appendMedia(form, "image", post.image);
		await pbRequest("/api/collections/posts/records", "POST", form);
		console.log(`  + [${status}] ${post.title}`);
	}
}
await migratePosts("published");
if (STRAPI_API_TOKEN) await migratePosts("draft");
else console.log("  (STRAPI_API_TOKEN 未設定のため下書きはスキップ)");

// --- announcements ---
console.log("[5/7] announcements を移行中...");
async function migrateAnnouncements(status) {
	const query =
		"pagination[pageSize]=100&sort=createdAt:asc" +
		(status === "draft" ? "&status=draft" : "");
	const data = await strapiGet("/api/announcements", query);
	for (const ann of data.data || []) {
		if (
			await pbFindFirst(
				"announcements",
				`title = '${(ann.title || "").replace(/'/g, "\\'")}'`,
			)
		)
			continue;
		await pbRequest("/api/collections/announcements/records", "POST", {
			title: ann.title,
			content: ann.content || "",
			published_date: ann.published_date || "",
			status,
		});
		console.log(`  + [${status}] ${ann.title}`);
	}
}
await migrateAnnouncements("published");
if (STRAPI_API_TOKEN) await migrateAnnouncements("draft");

// --- game-servers ---
console.log("[6/7] game-servers を移行中...");
{
	const data = await strapiGet("/api/game-servers", "pagination[pageSize]=100");
	for (const server of data.data || []) {
		if (
			await pbFindFirst(
				"game_servers",
				`name = '${(server.name || "").replace(/'/g, "\\'")}'`,
			)
		)
			continue;
		await pbRequest("/api/collections/game_servers/records", "POST", {
			name: server.name,
			type: server.type || "other",
			ip: server.ip,
			port: server.port || 0,
			protocol: server.protocol || "",
			description: server.description || "",
		});
		console.log(`  + ${server.name}`);
	}
}

// --- settings ---
console.log("[7/7] settings を移行中...");
{
	try {
		const data = await strapiGet("/api/settings", "populate=*");
		const settings = data.data;
		const existing = await pbRequest(
			"/api/collections/settings/records?perPage=1",
		);
		if (settings && (!existing.items || existing.items.length === 0)) {
			const form = new FormData();
			if (settings.site_title) form.append("site_title", settings.site_title);
			if (settings.site_description)
				form.append("site_description", settings.site_description);
			await appendMedia(form, "site_logo", settings.site_logo);
			await pbRequest("/api/collections/settings/records", "POST", form);
			console.log(`  + ${settings.site_title}`);
		}
	} catch (err) {
		console.warn(
			"  ! settings の移行に失敗（手動で設定してください）:",
			err.message,
		);
	}
}

console.log("\n移行が完了しました。");
console.log(
	"※ ユーザーのパスワードは移行できないため、各メンバーのパスワードを再設定してください。",
);
