/// <reference path="../pb_data/types.d.ts" />

// シリーズ（連載）機能を追加する。
// - series コレクション: 複数の記事をひとまとまりとして扱う
// - posts.series / posts.series_order: 所属シリーズと、その中での並び順
//
// posts.series は cascadeDelete = false。シリーズを消しても記事自体は残す。

migrate(
	(app) => {
		const series = new Collection({
			type: "base",
			name: "series",
			// 公開済みのシリーズだけを外部に見せる（posts / announcements と同じ方針）
			listRule: 'status = "published"',
			viewRule: 'status = "published"',
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: "text",
					name: "title",
					required: true,
					max: 0,
					min: 0,
					pattern: "",
				},
				{
					type: "text",
					name: "slug",
					required: true,
					max: 0,
					min: 0,
					pattern: "",
				},
				{
					type: "text",
					name: "description",
					required: false,
					max: 0,
					min: 0,
					pattern: "",
				},
				{
					type: "file",
					name: "cover_image",
					required: false,
					maxSelect: 1,
					maxSize: 0,
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
					type: "select",
					name: "status",
					required: false,
					maxSelect: 1,
					values: ["draft", "published"],
				},
				{ type: "autodate", name: "created", onCreate: true, onUpdate: false },
				{ type: "autodate", name: "updated", onCreate: true, onUpdate: true },
			],
			indexes: ["CREATE UNIQUE INDEX idx_series_slug ON series (slug)"],
		});
		app.save(series);

		const posts = app.findCollectionByNameOrId("posts");
		posts.fields.add(
			new Field({
				type: "relation",
				name: "series",
				required: false,
				collectionId: series.id,
				cascadeDelete: false,
				maxSelect: 1,
				minSelect: 0,
			}),
		);
		posts.fields.add(
			new Field({
				type: "number",
				name: "series_order",
				required: false,
				onlyInt: true,
			}),
		);
		return app.save(posts);
	},
	(app) => {
		const posts = app.findCollectionByNameOrId("posts");
		posts.fields.removeByName("series");
		posts.fields.removeByName("series_order");
		app.save(posts);

		return app.delete(app.findCollectionByNameOrId("series"));
	},
);
