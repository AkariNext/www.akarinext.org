#!/usr/bin/env node
/**
 * Directus コレクション・権限を自動作成するスクリプト
 * 使い方: DIRECTUS_URL=https://... DIRECTUS_EMAIL=admin@... DIRECTUS_PASSWORD=... node scripts/directus-init-schema.mjs
 */

import {
	authentication,
	createDirectus,
	createItem,
	readCollections,
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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(method, path, body) {
    await sleep(100); // Wait a bit between requests
	const token = await client.getToken();
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
		throw new Error(`HTTP ${res.status} on ${path}: ${err}`);
	}
	return res.json().catch(() => ({}));
}

async function hasCollection(name) {
	const cols = await client.request(readCollections());
	return cols.some((c) => c.collection === name);
}

// 共通: 不足フィールドを確認・追加、または既存フィールドを更新する関数
async function ensureFields(collection, fields) {
	console.log(`${collection} のフィールドを確認中...`);
	const res = await request("GET", `/fields/${collection}`);
	const existingFieldsData = res?.data || [];

	for (const fieldDef of fields) {
		const existingField = existingFieldsData.find(f => f.field === fieldDef.field);

		if (!existingField) {
			console.log(`  + ${fieldDef.field} を追加中...`);
			try {
				await request("POST", `/fields/${collection}`, fieldDef);
				console.log(`    ✓ ${fieldDef.field} 追加成功`);
			} catch (e) {
				console.warn(`    ! ${fieldDef.field} 追加失敗:`, e.message);
			}
		} else {
			// 型が異なる場合は削除して再作成（警告付き。データは失われますが、スキーマの整合性を優先）
			if (existingField.type !== fieldDef.type && fieldDef.type !== 'alias' && existingField.type !== 'alias') {
				console.warn(`  ! 型不一致を検出: ${collection}.${fieldDef.field} (既存: ${existingField.type}, 新規: ${fieldDef.type})`);
				console.log(`    ~ フィールドを再作成して型を同期します...`);
				try {
					await request("DELETE", `/fields/${collection}/${fieldDef.field}`);
					await request("POST", `/fields/${collection}`, fieldDef);
					console.log(`    ✓ ${fieldDef.field} の再作成完了`);
					continue; // 次のフィールドへ
				} catch (e) {
					console.error(`    ✕ ${fieldDef.field} の再作成に失敗しました:`, e.message);
				}
			}

			// 既存フィールドの更新を試みる (メタデータの同期)
			console.log(`  ~ ${fieldDef.field} の更新を確認中...`);
			try {
				// メタデータやオプションをマージして更新
				await request("PATCH", `/fields/${collection}/${fieldDef.field}`, {
					meta: fieldDef.meta,
					schema: fieldDef.schema
				});
				console.log(`    ✓ ${fieldDef.field} 更新/確認完了`);
			} catch (e) {
				console.warn(`    ! ${fieldDef.field} 更新失敗:`, e.message);
                if (e.message.includes("400")) {
                    console.warn(`      (詳細: 既存のデータ型と新しいインターフェースの互換性がない可能性があります)`);
                }
			}
		}
	}
}

async function main() {
	console.log("Directus にログイン中...", DIRECTUS_URL);
	await client.login({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD });
	console.log("ログイン成功\n");

	// --- 定義: 各コレクションのフィールド ---

	const authorsFields = [
		{ field: "name", type: "string", meta: { interface: "input" } },
		{ field: "avatar", type: "uuid", meta: { interface: "file-image" } },
		{
			field: "is_staff",
			type: "boolean",
			meta: { interface: "boolean", note: "運営メンバーとして表示するか" },
			schema: { default_value: false },
		},
		{
			field: "staff_title",
			type: "string",
			meta: { interface: "input", note: "役職（例: Administrator）" },
		},
		{ field: "bio", type: "text", meta: { interface: "input-multiline" } },
		{
			field: "social_links",
			type: "json",
			meta: {
				interface: "list",
				options: {
					template: "{{platform}}: {{url}}",
					fields: [
						{
							field: "platform",
							name: "Platform",
							type: "string",
							meta: {
								interface: "select-dropdown",
								options: {
									choices: [
										{ text: "X (Twitter)", value: "twitter" },
										{ text: "GitHub", value: "github" },
										{ text: "Discord", value: "discord" },
										{ text: "Website", value: "website" },
										{ text: "Twitch", value: "twitch" },
										{ text: "YouTube", value: "youtube" },
									],
								},
							},
						},
						{
							field: "url",
							name: "URL",
							type: "string",
							meta: { interface: "input" },
						},
					],
				},
			},
		},
	];

	const globalFields = [
		{ field: "site_title", type: "string", meta: { interface: "input" } },
		{
			field: "site_description",
			type: "text",
			meta: { interface: "input-multiline" },
		},
		{ field: "site_logo", type: "uuid", meta: { interface: "file-image" } },
	];

	const postsFields = [
		{
			field: "title",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "slug",
			type: "string",
			meta: {
				interface: "input",
				required: false,
				note: "空のまま保存するとIDでURLが生成されます。任意で指定可能。",
			},
			schema: { is_nullable: true },
		},
		{
			field: "content",
			type: "text",
			meta: { interface: "input-rich-text-md" }, // Markdownエディタに変更
		},
		{
			field: "author",
			type: "integer",
			meta: { interface: "select-dropdown-m2o" },
		},
		{
			field: "published_date",
			type: "timestamp",
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

	const announcementsFields = [
		{
			field: "title",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "content",
			type: "text",
			meta: { interface: "input-rich-text-md" }, // Markdownエディタに変更
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
	];

	const gamesFields = [
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
	];

	const gameServersFields = [
		{
			field: "name",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "type",
			type: "string",
			meta: {
				interface: "select-dropdown",
				required: true,
				options: {
					choices: [
						{ text: "Minecraft", value: "minecraft" },
						{ text: "Web Service", value: "web" },
						{ text: "Other", value: "other" },
					],
				},
			},
		},
		{
			field: "ip",
			type: "string",
			meta: { interface: "input", required: true },
		},
		{
			field: "port",
			type: "integer",
			meta: { interface: "input", required: true },
			schema: { default_value: 25565 },
		},
		{
			field: "protocol",
			type: "string",
			meta: { interface: "input" },
			schema: { default_value: "TCP" },
		},
		{
			field: "description",
			type: "text",
			meta: { interface: "input-multiline" },
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
			schema: { default_value: "published" },
		},
	];

	// --- 1. authors ---
	if (!(await hasCollection("authors"))) {
		console.log("authors を作成中...");
		await request("POST", "/collections", {
			collection: "authors",
			schema: { name: "authors" },
			meta: { icon: "person", singleton: false },
			fields: authorsFields,
		});
		console.log("  ✓ authors 作成完了");
	} else {
		console.log("authors は既に存在します");
		await ensureFields("authors", authorsFields);
	}

    // --- 1.5 authors M2M Relations (Junction Tables) ---
    // Helper to create M2M junction
    const ensureM2M = async (junctionName, fieldName, note) => {
        if (!(await hasCollection(junctionName))) {
            console.log(`${junctionName} (M2M中間テーブル) を作成中...`);
            await request("POST", "/collections", {
                collection: junctionName,
                meta: { hidden: true, icon: "import_export" },
                schema: { name: junctionName },
                fields: [
                    { field: "authors_id", type: "integer", meta: { hidden: true } },
                    { field: "games_id", type: "integer", meta: { hidden: true } },
                    { 
                        field: "skill_level", 
                        type: "string", 
                        meta: { 
                            interface: "select-dropdown",
                            note: "スキルレベル",
                            options: {
                                choices: [
                                    { text: "カジュアル", value: "casual" },
                                    { text: "中級", value: "intermediate" },
                                    { text: "エキスパート", value: "expert" },
                                    { text: "あなたより上手", value: "better_than_you" }
                                ]
                            }
                        } 
                    },
                    { 
                        field: "impression", 
                        type: "string", 
                        meta: { 
                            interface: "select-dropdown",
                            note: "感想",
                            options: {
                                choices: [
                                    { text: "夢中", value: "obsessed" },
                                    { text: "大好き", value: "love" },
                                    { text: "わりと好き", value: "like" },
                                    { text: "ビミョーかも", value: "meh" },
                                    { text: "ギブアップ", value: "give_up" }
                                ]
                            }
                        } 
                    },
                    {
                        field: "recruitment",
                        type: "string",
                        meta: {
                            interface: "select-dropdown",
                            note: "募集内容",
                            options: {
                                choices: [
                                    { text: "グループ探してます", value: "looking_for_group" },
                                    { text: "いつでも誘って", value: "invite_anytime" },
                                    { text: "ヒントを教えて", value: "need_hints" },
                                    { text: "教えられるよ", value: "can_teach" },
                                    { text: "議論大歓迎", value: "discussion_welcome" }
                                ]
                            }
                        }
                    }
                ]
            });

            // Relation: authors -> junction
            await request("POST", "/relations", {
                collection: junctionName,
                field: "authors_id",
                related_collection: "authors",
                meta: {
                    one_collection: "authors",
                    one_field: fieldName, // Set the alias field name here!
                    many_collection: junctionName,
                    many_field: "authors_id",
                    junction_field: "games_id",
                },
                schema: { on_delete: "CASCADE" }
            });

            // Relation: junction -> games
            await request("POST", "/relations", {
                collection: junctionName,
                field: "games_id",
                related_collection: "games",
                meta: {
                    one_collection: "games",
                    one_field: null,
                    many_collection: junctionName,
                    many_field: "games_id",
                    junction_field: "authors_id",
                },
                schema: { on_delete: "CASCADE" }
            });
            
            console.log(`  ✓ ${junctionName} 作成とリレーション設定完了`);
        } else {
             console.log(`${junctionName} は既に存在します`);
        }

        // Ensure detailed status fields exist
        await ensureFields(junctionName, [
            { 
                field: "skill_level", 
                type: "string", 
                meta: { 
                    interface: "select-dropdown",
                    note: "スキルレベル",
                    options: {
                        choices: [
                            { text: "カジュアル", value: "casual" },
                            { text: "中級", value: "intermediate" },
                            { text: "エキスパート", value: "expert" },
                            { text: "あなたより上手", value: "better_than_you" }
                        ]
                    }
                } 
            },
            { 
                field: "impression", 
                type: "string", 
                meta: { 
                    interface: "select-dropdown",
                    note: "感想",
                    options: {
                        choices: [
                            { text: "夢中", value: "obsessed" },
                            { text: "大好き", value: "love" },
                            { text: "わりと好き", value: "like" },
                            { text: "ビミョーかも", value: "meh" },
                            { text: "ギブアップ", value: "give_up" }
                        ]
                    }
                } 
            },
            {
                field: "recruitment",
                type: "string",
                meta: {
                    interface: "select-dropdown",
                    note: "募集内容",
                    options: {
                        choices: [
                            { text: "グループ探してます", value: "looking_for_group" },
                            { text: "いつでも誘って", value: "invite_anytime" },
                            { text: "ヒントを教えて", value: "need_hints" },
                            { text: "教えられるよ", value: "can_teach" },
                            { text: "議論大歓迎", value: "discussion_welcome" }
                        ]
                    }
                }
            }
        ]);

        // 既存のリレーション定義を強制更新 (one_field の設定漏れを防ぐため)
        try {
            console.log(`  ~ ${junctionName}.authors_id リレーションを更新中...`);
            await request("PATCH", `/relations/${junctionName}/authors_id`, {
                meta: {
                    one_field: fieldName, // Alias field in authors
                }
            });
             console.log(`    ✓ リレーション更新完了`);
        } catch (e) {
            console.warn(`    ! リレーション更新失敗 (想定内:まだ存在しない等):`, e.message);
        }
    };

    await ensureM2M("authors_playing_games", "playing_games", "プレイ中のゲーム");
    await ensureM2M("authors_finished_games", "finished_games", "クリア済みのゲーム");

    // Add Alias Fields to authors (After relations exist)
    await ensureFields("authors", [
        {
            field: "playing_games",
            type: "alias",
            meta: {
                interface: "list-m2m",
                special: ["m2m"],
                note: "プレイ中のゲーム",
                // 簡易的なフィルタ: 同じユーザーがクリア済みにしたゲームは除外...したいが
                // Directusの標準フィルタ($parent等)はM2M作成時には複雑なため、
                // 一旦バリデーションは行わない（運用対処）
            },
        },
        {
            field: "finished_games",
            type: "alias",
            meta: {
                interface: "list-m2m",
                special: ["m2m"],
                note: "クリア済みのゲーム",
            },
        }
    ]);

	// --- 2. global (singleton) ---
	if (!(await hasCollection("global"))) {
		console.log("global を作成中...");
		await request("POST", "/collections", {
			collection: "global",
			schema: { name: "global" },
			meta: { icon: "settings", singleton: true },
			fields: globalFields,
		});
		console.log("  ✓ global 作成完了");
	} else {
		console.log("global は既に存在します");
		await ensureFields("global", globalFields);
	}

	// --- 3. posts ---
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
		console.log("posts は既に存在します");
		await ensureFields("posts", postsFields);

		// posts.author のリレーション確認・修復
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

	// --- 4. announcements ---
	if (!(await hasCollection("announcements"))) {
		console.log("announcements を作成中...");
		await request("POST", "/collections", {
			collection: "announcements",
			schema: { name: "announcements" },
			meta: { icon: "campaign", singleton: false },
			fields: announcementsFields,
		});
		console.log("  ✓ announcements 作成完了");
	} else {
		console.log("announcements は既に存在します");
		await ensureFields("announcements", announcementsFields);
	}

	// --- 5. games ---
	if (!(await hasCollection("games"))) {
		console.log("games を作成中...");
		await request("POST", "/collections", {
			collection: "games",
			schema: { name: "games" },
			meta: { icon: "sports_esports", singleton: false },
			fields: gamesFields,
		});
		console.log("  ✓ games 作成完了");
	} else {
		console.log("games は既に存在します");
		await ensureFields("games", gamesFields);
	}

	// --- 7. game_servers ---
	if (!(await hasCollection("game_servers"))) {
		console.log("game_servers を作成中...");
		await request("POST", "/collections", {
			collection: "game_servers",
			schema: { name: "game_servers" },
			meta: { icon: "dns", singleton: false },
			fields: gameServersFields,
		});
		console.log("  ✓ game_servers 作成完了");
	} else {
		console.log("game_servers は既に存在します");
		await ensureFields("game_servers", gameServersFields);
	}

	// --- リレーション・権限設定 ---

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
		}
	}

	// Public 権限
	console.log("\nPublic 権限について...");
	console.log("Directus の Settings -> Access Policies & Permissions にて");
	console.log("Public ロールに対して、以下のコレクションの Read 権限を手動で許可してください:");
	console.log(" - global, posts, announcements, games, game_servers, authors, directus_files, directus_presets");
	console.log(" - authors_playing_games, authors_finished_games (M2M中間テーブル)");

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

    // キャッシュクリア
    try {
        await request("POST", "/utils/cache/clear");
        console.log("\n✓ キャッシュをクリアしました");
    } catch (e) {
        console.warn("\n! キャッシュクリアに失敗しました (権限不足等の可能性)", e.message);
    }

	console.log("\n完了！");
}

main().catch((e) => {
	console.error("エラー:", e);
	process.exit(1);
});
