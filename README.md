# コミュニティサイト

Astro + PocketBase で作る、ゲーム記録・お知らせ・プレイ中メンバーを表示するサイトです。

## 機能

- **遊んだ記録**: メンバーが遊んだゲームや活動の記録を投稿
- **お知らせ**: 公式からのアナウンス
- **ゲーム一覧**: やってるゲームとプレイ中のメンバー
- **Discord 連携**: 投稿・お知らせの公開を Webhook で Discord に通知
- **サーバー監視**: ゲームサーバーの死活監視（InfluxDB + monitor スクリプト）

## 技術スタック

- **フロントエンド**: Astro（SSR / Node adapter）
- **CMS**: PocketBase（`backend/` ディレクトリ、単一バイナリで Self-host）
- **監視**: InfluxDB 2.x + `scripts/monitor.ts`
- **デザイン**: ニューモーフィズム
- **パッケージマネージャー**: pnpm

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. PocketBase（CMS）の起動

```bash
docker compose up -d pocketbase
# 初回のみ管理者を作成
docker compose exec pocketbase /pb/pocketbase superuser upsert admin@example.com <password> --dir /pb/pb_data
```

スキーマは `backend/pb_migrations/` から自動で適用されます。
管理画面 http://localhost:8090/_/ からコンテンツを登録してください。
詳細は [backend/README.md](backend/README.md) を参照。

### 3. 環境変数

`.env.example` を `.env` にコピーし、`PUBLIC_POCKETBASE_URL` を設定:

```
PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### 4. 開発サーバー起動

```bash
pnpm dev
```

## デプロイ（Dokploy）

### フロントエンド

1. リポジトリを Dokploy に接続し、Build Type で **Dockerfile**（または Nixpacks）を選択
2. 環境変数 `PUBLIC_POCKETBASE_URL` を設定
3. デプロイ

### CMS（PocketBase）

1. 同じリポジトリを Build Path `backend/` の Dockerfile でデプロイ
2. `/pb/pb_data` にボリュームをマウント
3. 詳細は [backend/README.md](backend/README.md) を参照

## Discord Webhook

投稿・お知らせを Discord に通知する設定は [docs/DISCORD_WEBHOOK.md](docs/DISCORD_WEBHOOK.md) を参照してください。

## Strapi からの移行

旧 Strapi 環境からのデータ移行は `backend/scripts/migrate-from-strapi.mjs` を使います
（[backend/README.md](backend/README.md) 参照）。
