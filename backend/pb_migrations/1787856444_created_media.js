/// <reference path="../pb_data/types.d.ts" />

// 記事本文に貼り付けた画像の置き場。
//
// posts.attachments でも保存はできるが、あちらは記事レコードが既にある前提で、
// 新規作成中（まだ id がない）の記事には使えない。本文を書いている最中に
// 貼り付けられるよう、記事から独立したコレクションにしている。
//
// 参照は Markdown の URL 経由なので、記事を消しても画像は残る。

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");

		const media = new Collection({
			type: "base",
			name: "media",
			// 記事本文から参照するため読み取りは公開
			listRule: "",
			viewRule: "",
			// アップロードはログインしているメンバーのみ。差し替え・削除は本人だけ
			createRule: '@request.auth.id != "" && @request.auth.id = uploader',
			updateRule: "@request.auth.id = uploader",
			deleteRule: "@request.auth.id = uploader",
			fields: [
				{
					type: "file",
					name: "file",
					required: true,
					maxSelect: 1,
					maxSize: 8388608,
					mimeTypes: [
						"image/jpeg",
						"image/png",
						"image/webp",
						"image/gif",
						"image/svg+xml",
					],
					thumbs: null,
					protected: false,
				},
				{
					type: "relation",
					name: "uploader",
					required: true,
					collectionId: users.id,
					cascadeDelete: false,
					maxSelect: 1,
					minSelect: 0,
				},
				{ type: "text", name: "alt", required: false, max: 300, min: 0, pattern: "" },
				{ type: "autodate", name: "created", onCreate: true, onUpdate: false },
				{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
			],
			indexes: ["CREATE INDEX idx_media_uploader ON media (uploader)"],
		});

		return app.save(media);
	},
	(app) => {
		return app.delete(app.findCollectionByNameOrId("media"));
	},
);
