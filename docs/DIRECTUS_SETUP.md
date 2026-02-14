# Directus セットアップガイド

## 自動セットアップ（推奨）

以下のコマンドでコレクションと権限を自動作成できます。

```bash
# 環境変数を設定して実行
DIRECTUS_URL=https://your-directus.com DIRECTUS_EMAIL=admin@example.com DIRECTUS_PASSWORD=yourpassword pnpm directus:init
```

ローカル開発（docker-compose）の場合:

```bash
docker compose up -d directus
# Directus が起動するまで少し待ってから
DIRECTUS_URL=http://localhost:8055 DIRECTUS_EMAIL=admin@example.com DIRECTUS_PASSWORD=admin pnpm directus:init
```

## 手動セットアップ

自動セットアップが使えない場合、以下のコレクションを手動で作成してください。

### 1. global（シングルトン）

サイト全体の設定。**Settings → Data Model** で「Treat as single object」を有効に。

| フィールド | 型 | キー |
|-----------|-----|------|
| site_title | Input | site_title |
| site_description | Input | site_description |
| site_logo | Image | site_logo |

### 2. authors

| フィールド | 型 | キー |
|-----------|-----|------|
| name | Input | name |
| avatar | Image | avatar |

### 3. posts（遊んだ記録）

| フィールド | 型 | キー |
|-----------|-----|------|
| title | Input | title |
| slug | Input | slug |
| content | WYSIWYG | content |
| author | Many to One → authors | author |
| published_date | DateTime | published_date |
| image | Image | image |
| category | Dropdown (tech, game, misc) | category |
| tags | Tags (JSON) | tags |
| status | Dropdown (draft, published) | status |

### 4. announcements（お知らせ）

| フィールド | 型 | キー |
|-----------|-----|------|
| title | Input | title |
| content | WYSIWYG | content |
| published_date | DateTime | published_date |
| status | Dropdown (draft, published) | status |

### 5. games

| フィールド | 型 | キー |
|-----------|-----|------|
| name | Input | name |
| slug | Input | slug |
| description | Input (または Text) | description |
| cover_image | Image | cover_image |

### 6. game_players

| フィールド | 型 | キー |
|-----------|-----|------|
| user | Many to One → authors | user |
| game | Many to One → games | game |
| started_at | DateTime | started_at |
| status | Dropdown (playing, finished) | status |

## アクセス権限

**Settings → Access Policies & Permissions → Public** をクリックし、以下のコレクションに **Read** 権限（目のアイコン）を許可してください:

- `global`
- `posts`
- `announcements`
- `games`
- `game_players`
- `authors`
- `directus_files`
- `directus_presets`（画像変換プリセットの適用に必要）

## 画像の表示について

現在、高解像度の画像（数GB〜数十MB）を扱う場合、Directus側でのリアルタイム変換が失敗する可能性があるため、コード上では直接リサイズパラメータを指定しています。
必要に応じて、Directusサーバーの `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION` 設定を確認してください。

## サーバー監視 (InfluxDB + Telegraf)

サーバーの Ping や可用性を可視化するために InfluxDB と Telegraf を使用します。

### 1. 起動
```bash
docker compose up -d influxdb telegraf
```

### 2. InfluxDB の初期設定
1. `http://localhost:8086` にアクセスします。
2. Setup を完了させ（ユーザー: `admin`など）、管理画面に入ります。
3. **Load Data -> API Tokens** から「All Access Token」を発行または確認します。

### 3. Telegraf の設定
1. プロジェクトルートにある `telegraf.conf` を開きます。
2. `[[outputs.influxdb_v2]]` セクションの `token` を、先ほど取得したトークンに置き換えます。
3. `[[inputs.ping]]` の `urls` に監視したいサーバーを追加します。
4. 設定変更後、`docker compose restart telegraf` を実行します。

## 環境変数

Astro のビルド時に以下の環境変数を設定してください。

- `PUBLIC_DIRECTUS_URL`: `https://cms.example.com` など
- `INFLUX_TOKEN`: InfluxDB の API トークン
- `INFLUX_ORG`: `akarinext`
- `INFLUX_BUCKET`: `server_metrics`
- `INFLUX_URL`: `http://localhost:8086`
