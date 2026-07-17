# Discord Webhook 連携

投稿（遊んだ記録）やお知らせが **published** になると、Discord のチャンネルに自動で通知が送られます。
実装は `backend/pb_hooks/`（PocketBase の JS フック）にあり、リポジトリに含まれているため
Webhook URL を環境変数で渡すだけで動きます。

## 1. Discord Webhook の作成

1. Discord で通知を送りたいチャンネルを開く
2. チャンネル設定 → 連携サービス → Webhook
3. 「新しい Webhook」を作成
4. Webhook URL をコピー（`https://discord.com/api/webhooks/xxxxx/yyyyy` 形式）

## 2. PocketBase 側の環境変数を設定

PocketBase のコンテナ（Dokploy の環境変数など）に以下を設定:

| 環境変数 | 用途 |
| --- | --- |
| `DISCORD_WEBHOOK_POSTS` | 投稿（posts）公開時の通知先 |
| `DISCORD_WEBHOOK_ANNOUNCEMENTS` | お知らせ（announcements）公開時の通知先 |
| `DISCORD_WEBHOOK_URL` | 上記が未設定のときの共通フォールバック |
| `PUBLIC_SITE_URL` | 通知に載せる記事リンクのベース URL（例: `https://www.akarinext.org`） |

設定後、PocketBase を再起動すると反映されます。

## 通知の仕様

- `status` が `published` で作成されたとき、または draft → published に変わったときに送信
- ネタバレ記事（`is_spoiler`）は本文プレビューを含めない
- 投稿には記事への直リンクが付く（`PUBLIC_SITE_URL` 設定時）

挙動を変えたい場合は `backend/pb_hooks/lib/notify.js` を編集してください。
