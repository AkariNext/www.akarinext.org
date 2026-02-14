#!/usr/bin/env node
/**
 * Directus コレクション・権限を自動作成するスクリプト
 * 使い方: DIRECTUS_URL=https://... DIRECTUS_EMAIL=admin@... DIRECTUS_PASSWORD=... node scripts/directus-init-schema.mjs
 */

import {
	authentication,
	createDirectus,
	createItem,
	login,
	readCollections,
	readFields,
	readSingleton,
	rest,
} from "@directus/sdk";

const DIRECTUS_URL =
	process.env.DIRECTUS_URL ||
	process.env.PUBLIC_DIRECTUS_URL ||
	"http://localhost:8055";
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL || "admin@example.com";
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD || "admin";

const client = createDirectus(DIRECTUS_URL).with(rest()).with(authentication());

async function request(method, path, body) {
	const token =
		typeof client.getToken === "function" ? await client.getToken() : null;
	const res = await fetch(`${DIRECTUS_URL}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		...(body ? { body: JSON.stringify(body) } : {}),
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`HTTP ${res.status}: ${err}`);
	}
	return res.json().catch(() => ({}));
}

async function hasCollection(name) {
	const cols = await client.request(readCollections());
	return cols.some((c) => c.collection === name);
}

async function main() {
	console.log("Directus にログイン中...", DIRECTUS_URL);
	await client.login({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD });
	console.log("ログイン成功\n");

	// 1. authors
	if (!(await hasCollection("authors"))) {
		console.log("authors を作成中...");
		await request("POST", "/collections", {
			collection: "authors",
			schema: { name: "authors" },
			meta: { icon: "person", singleton: false },
			fields: [
				{ field: "name", type: "string", meta: { interface: "input" } },
				{ field: "avatar", type: "uuid", meta: { interface: "file-image" } },
			],
		});
		console.log("  ✓ authors 作成完了");
	} else {
		console.log("authors は既に存在します");
	}

	// 2. global (singleton)
	if (!(await hasCollection("global"))) {
		console.log("global を作成中...");
		await request("POST", "/collections", {
			collection: "global",
			schema: { name: "global" },
			meta: { icon: "settings", singleton: true },
			fields: [
				{ field: "site_title", type: "string", meta: { interface: "input" } },
				{
					field: "site_description",
					type: "text",
					meta: { interface: "input-multiline" },
				},
				{ field: "site_logo", type: "uuid", meta: { interface: "file-image" } },

			],
		});
		console.log("  ✓ global 作成完了");
	} else {
		console.log("global は既に存在します");
	}

	// 3. posts
	const postsFields = [
		{
			field: "title",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "slug",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "content",
			type: "text",
			meta: { interface: "input-rich-text-html" },
		},
		{
			field: "author",
			type: "integer",
			meta: { interface: "select-dropdown-m2o" },
		},
		{
			field: "published_date",
			type: "date",
			meta: { interface: "datetime" },
		},
		{
			field: "category",
			type: "string",
			meta: {
				interface: "select-dropdown",
				required: true,
				options: {
					choices: [
						{ text: "技術・開発", value: "tech" },
						{ text: "ゲーム", value: "game" },
						{ text: "雑談", value: "misc" },
					],
				},
				note: "投稿のカテゴリを選択してください",
				width: "half",
			},
			schema: {
				default_value: "game",
			},
		},
		{
			field: "tags",
			type: "json",
			meta: {
				interface: "tags",
				width: "half",
			},
		},
		{ field: "image", type: "uuid", meta: { interface: "file-image" } },
		{
			field: "status",
			type: "string",
			meta: {
				interface: "select-dropdown",
				options: {
					choices: [
						{ text: "下書き", value: "draft" },
						{ text: "公開", value: "published" },
					],
				},
			},
		},
	];

	if (!(await hasCollection("posts"))) {
		console.log("posts を作成中...");
		await request("POST", "/collections", {
			collection: "posts",
			schema: { name: "posts" },
			meta: { icon: "article", singleton: false },
			fields: postsFields,
		});
		await request("POST", "/relations", {
			collection: "posts",
			field: "author",
			related_collection: "authors",
			meta: {
				many_collection: "posts",
				many_field: "author",
				one_collection: "authors",
				one_field: null,
			},
			schema: { on_delete: "SET NULL" },
		});
		console.log("  ✓ posts 作成完了");
	} else {
		console.log("posts は既に存在します。不足フィールドを確認中...");
		// 既存フィールドの確認と追加
		const existingFieldsStr = await request("GET", "/fields/posts");
		const existingFields = existingFieldsStr?.data?.map((f) => f.field) || [];

		for (const fieldDef of postsFields) {
			if (!existingFields.includes(fieldDef.field)) {
				console.log(`  + ${fieldDef.field} を追加中...`);
				try {
					await request("POST", "/fields/posts", fieldDef);
					console.log(`    ✓ ${fieldDef.field} 追加成功`);
				} catch (e) {
					console.warn(`    ! ${fieldDef.field} 追加失敗:`, e.message);
				}
			}
		}

		// posts.author のリレーションが切れている場合があるので再設定（エラー無視）
		try {
			await request("POST", "/relations", {
				collection: "posts",
				field: "author",
				related_collection: "authors",
				meta: {
					many_collection: "posts",
					many_field: "author",
					one_collection: "authors",
					one_field: null,
				},
				schema: { on_delete: "SET NULL" },
			});
			console.log("  ✓ posts.author リレーションを修復/確認しました");
		} catch (e) {
			// 既に存在する場合はエラーになる
		}
	}

	// 4. announcements
	if (!(await hasCollection("announcements"))) {
		console.log("announcements を作成中...");
		await request("POST", "/collections", {
			collection: "announcements",
			schema: { name: "announcements" },
			meta: { icon: "campaign", singleton: false },
			fields: [
				{
					field: "title",
					type: "string",
					meta: { interface: "input", required: true },
				},
				{
					field: "content",
					type: "text",
					meta: { interface: "input-rich-text-html" },
				},
				{
					field: "published_date",
					type: "date",
					meta: { interface: "datetime" },
				},
				{
					field: "status",
					type: "string",
					meta: {
						interface: "select-dropdown",
						options: {
							choices: [
								{ text: "下書き", value: "draft" },
								{ text: "公開", value: "published" },
							],
						},
					},
				},
			],
		});
		console.log("  ✓ announcements 作成完了");
	} else {
		console.log("announcements は既に存在します");
	}

	// 5. games
	if (!(await hasCollection("games"))) {
		console.log("games を作成中...");
		await request("POST", "/collections", {
			collection: "games",
			schema: { name: "games" },
			meta: { icon: "sports_esports", singleton: false },
			fields: [
				{
					field: "name",
					type: "string",
					meta: { interface: "input", required: true },
				},
				{
					field: "slug",
					type: "string",
					meta: { interface: "input", required: true },
				},
				{
					field: "description",
					type: "text",
					meta: { interface: "input-multiline" },
				},
				{
					field: "cover_image",
					type: "uuid",
					meta: { interface: "file-image" },
				},
			],
		});
		console.log("  ✓ games 作成完了");
	} else {
		console.log("games は既に存在します");
	}

	// 6. game_players
	if (!(await hasCollection("game_players"))) {
		console.log("game_players を作成中...");
		await request("POST", "/collections", {
			collection: "game_players",
			schema: { name: "game_players" },
			meta: { icon: "groups", singleton: false },
			fields: [
				{
					field: "user",
					type: "integer",
					meta: { interface: "select-dropdown-m2o" },
				},
				{
					field: "game",
					type: "integer",
					meta: { interface: "select-dropdown-m2o" },
				},
				{
					field: "started_at",
					type: "timestamp",
					meta: { interface: "datetime" },
				},
				{
					field: "status",
					type: "string",
					meta: {
						interface: "select-dropdown",
						options: {
							choices: [
								{ text: "プレイ中", value: "playing" },
								{ text: "終了", value: "finished" },
							],
						},
					},
				},
			],
		});
		await request("POST", "/relations", {
			collection: "game_players",
			field: "user",
			related_collection: "authors",
			meta: {
				many_collection: "game_players",
				many_field: "user",
				one_collection: "authors",
				one_field: null,
			},
			schema: { on_delete: "CASCADE" },
		});
		await request("POST", "/relations", {
			collection: "game_players",
			field: "game",
			related_collection: "games",
			meta: {
				many_collection: "game_players",
				many_field: "game",
				one_collection: "games",
				one_field: null,
			},
			schema: { on_delete: "CASCADE" },
		});
		console.log("  ✓ game_players 作成完了");
	} else {
		console.log("game_players は既に存在します");
	}

	// 画像プリセットの作成
	console.log("\n画像プリセットを確認中...");
	if (!(await hasCollection("directus_presets"))) {
		// directus_presets はシステムコレクションなので通常は存在します
	}
	
	// 画像プリセットのガイド
	console.log("\n【重要】画像プリセットの設定について");
	console.log("Directus の Settings -> Files & Thumbnails -> Presets にて");
	console.log("Key: 'card-thumb', Width: 600, Height: 400, Fit: Cover, Quality: 80");
	console.log("というプリセットを手動で作成してください（スクリプトからの作成はAPI制限により不安定なため）。");

	// 画像フィールドのリレーション設定（既存・新規問わず実行）
	console.log("\n画像リレーションを構成中...");
	const imageRelations = [
		{ collection: "authors", field: "avatar" },
		{ collection: "global", field: "site_logo" },
		{ collection: "posts", field: "image" },
		{ collection: "games", field: "cover_image" },
	];

	for (const { collection, field } of imageRelations) {
		try {
			await request("POST", "/relations", {
				collection,
				field,
				related_collection: "directus_files",
				meta: {
					many_collection: collection,
					many_field: field,
					one_collection: "directus_files",
					one_field: null,
				},
			});
			console.log(`  ✓ ${collection}.${field} -> directus_files 紐付け成功`);
		} catch (e) {
			// 既に存在する場合はエラーになるので無視
			// console.log(`  - ${collection}.${field}: 設定済み`);
		}
	}

	// Public 権限
	console.log("\nPublic 権限について...");
	console.log("Directus の Settings -> Access Policies & Permissions にて");
	console.log("Public ロールに対して、以下のコレクションの Read 権限を手動で許可してください:");
	console.log(" - global, posts, announcements, games, game_players, authors, directus_files, directus_presets");
	/*
	// 自動設定はDirectusのバージョン差異により失敗するため無効化
	const collectionsForPublic = [
		"global",
		"posts",
		"announcements",
		"games",
		"game_players",
		"authors",
		"directus_files",
	];

	for (const collection of collectionsForPublic) {
		try {
			await request("POST", "/permissions", {
				collection,
				action: "read",
				fields: ["*"],
				// policy: null で Public
			});
			console.log(`  ✓ ${collection}: Read 権限を付与`);
		} catch (e) {
			if (
				String(e?.message || e).includes("already") ||
				String(e?.message || e).includes("duplicate")
			) {
				console.log(`  - ${collection}: 既に権限あり`);
			} else {
				console.warn(`  ! ${collection}:`, e?.message || e);
			}
		}
	}
    */

	// global に初期データ（singleton は items で作成可能）
	try {
		const global = await client.request(readSingleton("global"));
		if (!global?.site_title) {
			await client.request(
				createItem("global", {
					site_title: "コミュニティサイト",
					site_description: "ゲームや活動の記録を共有するサイト",
				}),
			);
			console.log("\n✓ global に初期データを投入しました");
		}
	} catch (e) {
		console.log("\n※ global の初期データは手動で設定してください");
	}

	console.log("\n完了！");
}

main().catch((e) => {
	console.error("エラー:", e);
	process.exit(1);
});
