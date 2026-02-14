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

## 画像プリセット（必須）

最適化された画像を表示するために、**Settings → Files & Thumbnails → Presets** で以下のプリセットを作成してください。

### 1. card-thumb (記事・ゲームカード用)
- **Key**: `card-thumb`
- **Width**: `600`
- **Height**: `400`
- **Fit**: `Cover`
- **Quality**: `80`

### 2. avatar-thumb (著者アイコン用)
- **Key**: `avatar-thumb`
- **Width**: `48` (Retina対応)
- **Height**: `48`
- **Fit**: `Cover`
- **Quality**: `80`

## 環境変数

Astro のビルド時に `PUBLIC_DIRECTUS_URL` を設定してください。

例: `https://cms.example.com` または `http://localhost:8055`
