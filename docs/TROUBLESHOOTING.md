# トラブルシューティング

## サイトにコンテンツが表示されない

### 原因 1: PocketBase に接続できていない

- フロントの環境変数 `POCKETBASE_URL` が正しいか確認
- `curl <POCKETBASE_URL>/api/health` が `200` を返すか確認
- 画像だけ表示されない場合は `PUBLIC_MEDIA_BASE` と `/api/files` の Domain 設定を確認（[MEDIA_PROXY.md](MEDIA_PROXY.md)）

### 原因 2: 投稿・お知らせが draft のまま

`posts` / `announcements` は `status = "published"` のものだけが公開 API に出ます。
PocketBase 管理画面（`/_/`）でレコードの `status` を `published` に変更してください。

### 原因 3: スキーマが適用されていない

コレクションが存在しない場合、`backend/pb_migrations/` がコンテナにコピーされているか、
起動コマンドに `--migrationsDir` が渡っているかを確認してください
（`backend/Dockerfile` を使っていれば自動で適用されます）。

## 管理画面にログインできない

初回はスーパーユーザーの作成が必要です:

```bash
docker compose exec pocketbase /pb/pocketbase superuser upsert admin@example.com <password> --dir /pb/pb_data
```

## デプロイのたびにデータが消える

PocketBase のデータは SQLite + アップロードファイルとして `/pb/pb_data` に保存されます。
Dokploy などでは必ず `/pb/pb_data` にボリュームをマウントしてください。

## Discord に通知が飛ばない

- PocketBase 側の環境変数（`DISCORD_WEBHOOK_POSTS` など）が設定されているか確認
- 通知は「published になった瞬間」にだけ送られます（既に published のレコードの編集では送られない）
- PocketBase のログにエラーが出ていないか確認（[docs/DISCORD_WEBHOOK.md](DISCORD_WEBHOOK.md) 参照）
