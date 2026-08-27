/// <reference path="../pb_data/types.d.ts" />

// シリーズをメンバーが作れるようにする。
//
// シリーズは 1 人のものとは限らない。同じ連載に複数人が記事を寄せることも、
// 設定を分担して直すこともある。そこで作成者（owner）とは別に editors を置き、
// どちらも設定を編集できるようにした。消せるのは owner だけ。
//
// 記事をシリーズに紐付ける操作は posts 側のルールで守られている（自分の記事だけ）。
// 公開済みシリーズなら誰の記事でも入れられるので、共同で書き進められる。

migrate(
	(app) => {
		const series = app.findCollectionByNameOrId("series");
		const users = app.findCollectionByNameOrId("users");

		series.fields.add(
			new Field({
				type: "relation",
				name: "owner",
				required: false, // 既存レコードのために必須にしない
				collectionId: users.id,
				cascadeDelete: false,
				maxSelect: 1,
				minSelect: 0,
			}),
		);
		series.fields.add(
			new Field({
				type: "relation",
				name: "editors",
				required: false,
				collectionId: users.id,
				cascadeDelete: false,
				maxSelect: 20,
				minSelect: 0,
			}),
		);

		// 下書きは関係者だけに見せる
		series.listRule =
			'status = "published" || owner = @request.auth.id || editors.id ?= @request.auth.id';
		series.viewRule = series.listRule;
		series.createRule =
			'@request.auth.id != "" && @request.body.owner = @request.auth.id';
		// owner の付け替えは不可。共同編集者は設定を変えられる
		series.updateRule =
			'@request.auth.id != "" && (owner = @request.auth.id || editors.id ?= @request.auth.id) && @request.body.owner:changed = false';
		series.deleteRule = '@request.auth.id != "" && owner = @request.auth.id';

		return app.save(series);
	},
	(app) => {
		const series = app.findCollectionByNameOrId("series");
		series.fields.removeByName("owner");
		series.fields.removeByName("editors");
		series.listRule = 'status = "published"';
		series.viewRule = 'status = "published"';
		series.createRule = null;
		series.updateRule = null;
		series.deleteRule = null;
		return app.save(series);
	},
);
