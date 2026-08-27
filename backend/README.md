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

このディレクトリの `Dockerfile` をそのまま使う。PocketBase のバージョンは `ARG PB_VERSION` で固定されており、
`pb_migrations/` と `pb_hooks/` はイメージに焼き込まれるため、デプロイすればスキーマと Discord 通知が反映される。

1. Dokploy でこのリポジトリを接続し、Build Path を `backend/` に設定
2. **`/pb/pb_data` にボリュームをマウント**（これを忘れるとデプロイのたびにデータが消える）
3. ネットワークは `dokploy-network`（フロントエンドと同じ overlay）に置く。
   これでフロントエンドから `http://<Swarm サービス名>:8090` で到達でき、PocketBase を外部公開しなくて済む
4. 環境変数:
   - `DISCORD_WEBHOOK_POSTS` … 投稿公開時の通知先
   - `DISCORD_WEBHOOK_ANNOUNCEMENTS` … お知らせ公開時の通知先
   - `PUBLIC_SITE_URL` … 通知に載せる記事リンクのベース URL（例: `https://www.akarinext.org`）
5. 画像配信の設定は [../docs/MEDIA_PROXY.md](../docs/MEDIA_PROXY.md) を参照

スーパーユーザーは `pb_data` に既にあるものを引き継ぐ。新規に作る場合のみ:

```bash
docker exec <container> /pb/pocketbase superuser upsert admin@example.com <password> --dir /pb/pb_data
```

### バックアップと復元

停止せずにバックアップを取れる。管理画面の Backups からでも、API からでも作れる。

```bash
# 作成（コンテナ内の pb_data/backups に zip が置かれる）
curl -X POST -H "Authorization: <superuser token>" \
  -H "Content-Type: application/json" -d '{"name":"manual.zip"}' \
  http://localhost:8090/api/backups
```

zip はルートに `data.db` / `auxiliary.db` / `storage/` を含み、そのまま `pb_data` として展開できる。
別ボリュームへ移すときはこの zip を展開すればよい（ファイルを直接コピーするより安全）。

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
