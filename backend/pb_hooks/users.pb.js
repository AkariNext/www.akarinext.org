/// <reference path="../pb_data/types.d.ts" />

// Discord などの OAuth でサインアップしたとき、PocketBase は name / avatar / email は
// 埋めてくれるが、このコレクション独自の username は空のままになる。
// username は必須かつ UNIQUE なので、そのままでは
// 「Failed to create record. {username: cannot be blank}」で作成に失敗する。
// 空のときだけ、表示名かメールアドレスから重複しない username を組み立てる。

onRecordCreate((e) => {
	const record = e.record;
	if (record.getString("username").trim() !== "") {
		e.next();
		return;
	}

	// 英数字とハイフン・アンダースコアだけ残す。日本語名などで空になったら "member"
	const normalize = (raw) =>
		String(raw || "")
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "")
			.slice(0, 24);

	const email = record.email ? record.email() : "";
	const base =
		normalize(record.getString("name")) ||
		normalize(String(email).split("@")[0]) ||
		"member";

	const taken = (value) => {
		try {
			e.app.findFirstRecordByFilter("users", "username = {:username}", {
				username: value,
			});
			return true;
		} catch {
			// 見つからなければ例外になる = 空いている
			return false;
		}
	};

	let candidate = base;
	// 重複したら連番を足す。上限を切って無限ループを避ける
	for (let i = 2; i < 1000 && taken(candidate); i++) {
		candidate = `${base}${i}`;
	}

	record.set("username", candidate);
	e.next();
}, "users");
