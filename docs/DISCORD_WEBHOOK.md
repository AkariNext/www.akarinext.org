# Discord Webhook 連携

投稿やお知らせを Directus で作成・公開すると、Discord のチャンネルに自動で通知を送れます。

## 1. Discord Webhook の作成

1. Discord で通知を送りたいチャンネルを開く
2. チャンネル設定 → 連携サービス → Webhook
3. 「新しい Webhook」を作成
4. Webhook URL をコピー（`https://discord.com/api/webhooks/xxxxx/yyyyy` 形式）

## 2. Directus Flows で設定

### 投稿（posts）用フロー

1. **Settings → Flows** で新規フロー作成
2. **Trigger**: Event Hook を選択
   - Type: **Action (Non-Blocking)**
   - Scope: `items.create` または `items.update`
   - Collection: `posts`
3. **Condition** を追加（オプション）:
   - `$trigger.payload.status` が `published` と等しい場合のみ続行
4. **Webhook / Request URL** を追加:
   - Method: **POST**
   - URL: コピーした Discord Webhook URL を貼り付け
   - Headers: `Content-Type: application/json`
   - Request Body（JSON）:

```json
{
  "embeds": [{
    "title": "{{ $trigger.payload.title }}",
    "description": "{{ $trigger.payload.content }}",
    "color": 5814783,
    "timestamp": "{{ $trigger.payload.published_date }}",
    "footer": {
      "text": "遊んだ記録"
    }
  }]
}
```

### お知らせ（announcements）用フロー

同様に、Collection を `announcements` にしたフローを作成。Request Body の `footer.text` を `"お知らせ"` に変更。

## 3. 環境変数で Webhook URL を管理（推奨）

Webhook URL を環境変数に置くと安全です。

1. Directus の `.env` に追加:
   ```
   DISCORD_WEBHOOK_POSTS=https://discord.com/api/webhooks/xxx/yyy
   DISCORD_WEBHOOK_ANNOUNCEMENTS=https://discord.com/api/webhooks/xxx/zzz
   ```

2. Flows の Request URL で `{{ $env.DISCORD_WEBHOOK_POSTS }}` のように参照

※ Directus の Flows で `$env` が使えるかはバージョンにより異なります。使えない場合は Webhook URL を直接入力してください（URL の取り扱いに注意）。

## 4. 動作確認

1. Directus で投稿またはお知らせを「published」で保存
2. 対応する Discord チャンネルに Embed 付きメッセージが届くことを確認
