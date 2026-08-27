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

`.env.example` を `.env` にコピーする:

| 変数 | 用途 | 読まれる場所 |
| --- | --- | --- |
| `POCKETBASE_URL` | PocketBase API の接続先 | サーバーのみ（SSR / monitor） |
| `PUBLIC_MEDIA_BASE` | ブラウザが画像を取りに行くベース URL | クライアント（ビルド時に埋め込み） |

ローカルではプロキシを立てないので、両方 PocketBase を直接指す:

```
POCKETBASE_URL=http://localhost:8090
PUBLIC_MEDIA_BASE=http://localhost:8090/api/files
```

本番では PocketBase を外部公開せず、画像だけリバースプロキシで配信する
（[docs/MEDIA_PROXY.md](docs/MEDIA_PROXY.md) 参照）。

### 4. 開発サーバー起動

```bash
pnpm dev
```

## デプロイ（Dokploy）

### フロントエンド

1. リポジトリを Dokploy に接続し、Build Type で **Dockerfile**（または Nixpacks）を選択
2. Build Args に `PUBLIC_MEDIA_BASE=/api/files` を設定（クライアントに埋め込まれるためビルド時に必要）
3. ランタイム環境変数に `POCKETBASE_URL=http://<pocketbase のサービス名>:8090` を設定
4. `www.akarinext.org/api/files` を PocketBase に向ける Domain を追加（[docs/MEDIA_PROXY.md](docs/MEDIA_PROXY.md)）
5. デプロイ

### CMS（PocketBase）

1. 同じリポジトリを Build Path `backend/` の Dockerfile でデプロイ
2. `/pb/pb_data` にボリュームをマウント
3. ドメインを割り当てず、内部ネットワークからのみ到達できるようにする
   （管理画面 `/_/` を外部に晒さないため。管理は SSH ポートフォワード経由で行う）
4. 詳細は [backend/README.md](backend/README.md) を参照

## サーバー監視

`scripts/monitor.ts` が 2 種類の監視を行います。フロントエンドと同じコンテナで
`concurrently` により起動します（`pnpm start:all`）。

| 監視 | 対象 | 間隔 | 必要な設定 |
| --- | --- | --- | --- |
| ping / TCP | `game_servers` コレクションの各サーバー | 10 秒 | `INFLUX_TOKEN` |
| HTTP 外形 | `MONITOR_HTTP_TARGETS` の各 URL | 60 秒 | なし（任意で `DISCORD_WEBHOOK_ALERTS`） |

HTTP 外形監視は**リバースプロキシ（Traefik）の障害を検知するため**にあります。
Traefik が落ちるとサーバー上の全サイトが 502 になりますが、TCP 接続自体は
Cloudflare が受けるため ping や TCP 監視では気づけません。ステータスコードまで
確認して、`MONITOR_ALERT_AFTER` 回連続で失敗したら Discord に通知します。
復旧したときも一度だけ通知します。

InfluxDB が未設定でも HTTP 監視と通知は動きます（記録が残らないだけ）。

> **注意**: monitor はこのサーバー自身で動いているため、サーバーごと停止した場合は
> 検知できません。外部の監視サービスと併用してください。

### Traefik の自動復旧

`scripts/traefik-watchdog.sh` は、停止している Traefik を起動し直すスクリプトです。

Traefik は Dokploy 管理下ですが **Swarm service ではなく単独コンテナ**で動いており、
Swarm の自己修復が効きません。さらに `restart: always` には
「明示的に `docker stop` された場合は再起動しない」という Docker の仕様があるため、
Dokploy の更新処理などで止められるとそのまま放置されます。
Traefik はサーバー上の全サイトの唯一の入口なので、止まったままだと全ドメインが 502 を返し続けます。

サーバー側に配置し、docker グループに属するユーザーの crontab で毎分実行します。

```bash
scp scripts/traefik-watchdog.sh <server>:~/bin/traefik-watchdog.sh
ssh <server> chmod +x ~/bin/traefik-watchdog.sh
crontab -e
# * * * * * /home/yupix/bin/traefik-watchdog.sh
```

正常なときは何も出力しません（毎分動くのでログを膨らませないため）。
復旧したときと失敗したときだけ `~/traefik-watchdog.log` に記録し、
`DISCORD_WEBHOOK_ALERTS` が設定されていれば Discord にも通知します。

## Discord Webhook

投稿・お知らせを Discord に通知する設定は [docs/DISCORD_WEBHOOK.md](docs/DISCORD_WEBHOOK.md) を参照してください。

## Strapi からの移行

旧 Strapi 環境からのデータ移行は `backend/scripts/migrate-from-strapi.mjs` を使います
（[backend/README.md](backend/README.md) 参照）。
