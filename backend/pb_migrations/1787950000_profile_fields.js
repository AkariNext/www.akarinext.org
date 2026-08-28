/// <reference path="../pb_data/types.d.ts" />

// プロフィール編集画面のために users へ 3 つ足す。
//
// - location: 所在地。自由記述
// - location_public: 所在地を公開ページに出すか
// - games_public: ゲーム棚を公開ページに出すか
//
// bool の初期値は false なので、そのまま足すと今まで見えていた
// ゲーム棚が全員ぶん消える。既存ユーザーは true に揃えてから終える。

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");

		users.fields.add(
			new Field({
				type: "text",
				name: "location",
				required: false,
				max: 60,
				min: 0,
				pattern: "",
			}),
		);
		users.fields.add(
			new Field({ type: "bool", name: "location_public", required: false }),
		);
		users.fields.add(
			new Field({ type: "bool", name: "games_public", required: false }),
		);

		app.save(users);

		// 今の見え方を変えないよう、作成済みのアカウントは公開のままにする
		for (const record of app.findAllRecords("users")) {
			record.set("games_public", true);
			record.set("location_public", true);
			app.save(record);
		}
	},
	(app) => {
		const users = app.findCollectionByNameOrId("users");
		users.fields.removeByName("location");
		users.fields.removeByName("location_public");
		users.fields.removeByName("games_public");
		return app.save(users);
	},
);
