# トラブルシューティング

## ビルド時に 403 が出る

### 原因

Directus の API が 403 Forbidden を返しています。主な原因は **Public ロールに Read 権限が付与されていない** ことです。

### 解決方法

#### 方法 1: Directus の権限を設定する（推奨）

1. Directus 管理画面にログイン
2. **Settings** → **Access Policies** → **Public**
3. 以下のコレクションに **Read** 権限を付与:
   - global
   - posts
   - announcements
   - games
   - game_players
   - authors
   - directus_files

#### 方法 2: ビルド時に Directus をスキップする

Directus に接続せずにビルドする場合（空のデータでビルド）:

```bash
# 環境変数でスキップ
PUBLIC_SKIP_DIRECTUS_BUILD=true pnpm run build
```

Dokploy の場合、環境変数に `PUBLIC_SKIP_DIRECTUS_BUILD=true` を追加してください。

## デプロイ後にサイトが 403 になる

- nginx の設定を確認
- ファイルのパーミッションを確認
- Dokploy のポート設定（80）を確認
