// Discord Webhook 通知の実体（pb_hooks から require される共通モジュール）

/**
 * posts / announcements レコードを Discord に通知する。
 * status が published でない場合や Webhook URL 未設定の場合は何もしない。
 */
function record(rec) {
	if (rec.getString("status") !== "published") return;

	const collection = rec.collection().name;
	const isAnnouncement = collection === "announcements";
	const envKey = isAnnouncement
		? "DISCORD_WEBHOOK_ANNOUNCEMENTS"
		: "DISCORD_WEBHOOK_POSTS";
	const webhookUrl = $os.getenv(envKey) || $os.getenv("DISCORD_WEBHOOK_URL");
	if (!webhookUrl) return;

	const embed = {
		title: rec.getString("title"),
		color: isAnnouncement ? 15844367 : 5814783,
		footer: { text: isAnnouncement ? "お知らせ" : "遊んだ記録" },
	};

	// ネタバレ記事は本文を出さない
	if (!rec.getBool("is_spoiler")) {
		const content = rec.getString("content") || "";
		const plain = content
			.replace(/[#*_`>[\]!]/g, "")
			.replace(/\s+/g, " ")
			.trim();
		if (plain) embed.description = plain.slice(0, 200);
	}

	const siteUrl = ($os.getenv("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
	if (!isAnnouncement && siteUrl) {
		embed.url = `${siteUrl}/posts/${rec.getString("slug") || rec.id}`;
	}

	try {
		$http.send({
			url: webhookUrl,
			method: "POST",
			body: JSON.stringify({ embeds: [embed] }),
			headers: { "Content-Type": "application/json" },
			timeout: 10,
		});
	} catch (err) {
		console.log("[discord] 通知の送信に失敗しました:", err);
	}
}

module.exports = { record };
