/// <reference path="../pb_data/types.d.ts" />

// Discord ログイン中のメンバーが、自分の記事とゲーム棚だけを編集できるようにする。
migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId("posts");
		posts.listRule = 'status = "published" || author = @request.auth.id';
		posts.viewRule = 'status = "published" || author = @request.auth.id';
		posts.createRule =
			'@request.auth.id != "" && @request.body.author = @request.auth.id';
		posts.updateRule =
			'@request.auth.id != "" && author = @request.auth.id && @request.body.author:changed = false';
		posts.deleteRule = '@request.auth.id != "" && author = @request.auth.id';
		app.save(posts);

		const userGames = app.findCollectionByNameOrId("user_games");
		userGames.createRule =
			'@request.auth.id != "" && @request.body.user = @request.auth.id';
		userGames.updateRule =
			'@request.auth.id != "" && user = @request.auth.id && @request.body.user:changed = false';
		userGames.deleteRule = '@request.auth.id != "" && user = @request.auth.id';
		return app.save(userGames);
	},
	(app) => {
		const posts = app.findCollectionByNameOrId("posts");
		posts.listRule = 'status = "published"';
		posts.viewRule = 'status = "published"';
		posts.createRule = null;
		posts.updateRule = null;
		posts.deleteRule = null;
		app.save(posts);

		const userGames = app.findCollectionByNameOrId("user_games");
		userGames.createRule = null;
		userGames.updateRule = null;
		userGames.deleteRule = null;
		return app.save(userGames);
	},
);
