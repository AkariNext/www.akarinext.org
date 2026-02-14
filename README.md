# コミュニティサイト

Astro + Directus で作る、ゲーム記録・お知らせ・プレイ中メンバーを表示するサイトです。

## 機能

- **遊んだ記録**: メンバーが遊んだゲームや活動の記録を投稿
- **お知らせ**: 公式からのアナウンス
- **ゲーム一覧**: やってるゲームとプレイ中のメンバー
- **Discord 連携**: 投稿・お知らせを Webhook で Discord に通知

## 技術スタック

- **フロントエンド**: Astro
- **CMS**: Directus
- **デザイン**: ニューモーフィズム
- **パッケージマネージャー**: pnpm

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. Directus のセットアップ

Directus を別途起動し、[docs/DIRECTUS_SETUP.md](docs/DIRECTUS_SETUP.md) に従ってコレクションを作成してください。

### 3. 環境変数

`.env.example` を `.env` にコピーし、`PUBLIC_DIRECTUS_URL` を設定:

```
PUBLIC_DIRECTUS_URL=https://your-directus-url.com
```

### 4. 開発サーバー起動

```bash
pnpm dev
```

## デプロイ（Dokploy）

### Dockerfile を使う場合

1. リポジトリを Dokploy に接続
2. Build Type で **Dockerfile** を選択
3. 環境変数 `PUBLIC_DIRECTUS_URL` を設定
4. デプロイ

### Nixpacks を使う場合

1. Build Type で **Nixpacks** を選択
2. 環境変数 `PUBLIC_DIRECTUS_URL` を設定
3. デプロイ

## Discord Webhook

投稿・お知らせを Discord に通知する設定は [docs/DISCORD_WEBHOOK.md](docs/DISCORD_WEBHOOK.md) を参照してください。
