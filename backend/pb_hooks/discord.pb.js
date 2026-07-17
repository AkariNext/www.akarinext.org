/// <reference path="../pb_data/types.d.ts" />

// 投稿・お知らせが「published」になったタイミングで Discord Webhook に通知する。
// Webhook URL は環境変数で設定（docs/DISCORD_WEBHOOK.md を参照）:
//   DISCORD_WEBHOOK_POSTS / DISCORD_WEBHOOK_ANNOUNCEMENTS / DISCORD_WEBHOOK_URL（共通フォールバック）

// published 状態で新規作成されたとき
onRecordAfterCreateSuccess(
	(e) => {
		const notify = require(`${__hooks}/lib/notify.js`);
		notify.record(e.record);
		e.next();
	},
	"posts",
	"announcements",
);

// draft から published に更新されたとき
onRecordUpdateExecute(
	(e) => {
		const wasPublished =
			e.record.original().getString("status") === "published";
		e.next();
		if (!wasPublished && e.record.getString("status") === "published") {
			const notify = require(`${__hooks}/lib/notify.js`);
			notify.record(e.record);
		}
	},
	"posts",
	"announcements",
);
