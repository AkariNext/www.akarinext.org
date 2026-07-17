# backend（PocketBase）

AkariNext コミュニティサイトの CMS / API。[PocketBase](https://pocketbase.io/) の単一バイナリで動く。

- スキーマは `pb_migrations/` にマイグレーションとして管理（起動時に自動適用）
- Discord 通知は `pb_hooks/` に実装（[docs/DISCORD_WEBHOOK.md](../docs/DISCORD_WEBHOOK.md) 参照）
- データは `pb_data/`（SQLite + アップロードファイル）に保存される

## コレクション構成

| コレクション | 用途 |
| --- | --- |
| `users`（auth） | メンバー。`name` / `avatar` / `is_staff` / `staff_title` / `bio` / `social_links`(JSON) |
| `posts` | 遊んだ記録。Markdown 本文、`category`、`tags`、`status`(draft/published) |
| `announcements` | お知らせ。`status`(draft/published) |
| `games` | ゲームマスタ |
| `user_games` | メンバー × ゲーム（`list`: playing/finished、スキル・感想・募集状況） |
| `tags` | 投稿タグ |
| `game_servers` | 監視対象のゲームサーバー |
| `settings` | サイト設定（1 レコードだけ作る） |

公開 API は読み取り専用。`posts` / `announcements` は `status = "published"` のものだけが公開される。
書き込みは管理画面（スーパーユーザー）から行う。

## ローカルでの起動

```bash
# バイナリを https://pocketbase.io/docs/ からダウンロードして PATH に置くか、リポジトリ直下で:
pocketbase serve --dir ./pb_data --migrationsDir ./pb_migrations --hooksDir ./pb_hooks

# 初回はスーパーユーザー（管理者）を作成
pocketbase superuser upsert admin@example.com <password> --dir ./pb_data
```

管理画面: http://localhost:8090/_/

## Docker / Dokploy でのデプロイ

このディレクトリの `Dockerfile` をそのまま使える。

1. Dokploy でこのリポジトリを接続し、Build Path を `backend/` に設定
2. `/pb/pb_data` にボリュームをマウント（これを忘れるとデプロイのたびにデータが消える）
3. 必要に応じて環境変数を設定:
   - `DISCORD_WEBHOOK_POSTS` … 投稿公開時の通知先
   - `DISCORD_WEBHOOK_ANNOUNCEMENTS` … お知らせ公開時の通知先
   - `PUBLIC_SITE_URL` … 通知に載せる記事リンクのベース URL（例: `https://www.akarinext.org`）
4. デプロイ後、コンテナ内で一度だけスーパーユーザーを作成:
   ```bash
   /pb/pocketbase superuser upsert admin@example.com <password> --dir /pb/pb_data
   ```

## Strapi からのデータ移行

```bash
STRAPI_URL=https://old-strapi.example.com \
POCKETBASE_URL=http://localhost:8090 \
PB_SUPERUSER_EMAIL=admin@example.com \
PB_SUPERUSER_PASSWORD=xxxx \
node scripts/migrate-from-strapi.mjs
```

- 再実行しても重複は作られない（slug / username で判定）
- `STRAPI_API_TOKEN` を渡すと下書き記事も移行される
- ユーザーのパスワードは移行できないため、移行後に再設定が必要

## スキーマを変更するとき

管理画面でコレクションを変更すると、`--migrationsDir` に自動でマイグレーションファイルが生成される
（`--automigrate` はデフォルト有効）。生成されたファイルをコミットすること。
まとめて出力し直したい場合は `pocketbase migrate collections` でスナップショットを作成できる。
