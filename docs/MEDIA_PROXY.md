# 画像配信のプロキシ設定

PocketBase にドメインを割り当てないまま運用するための構成メモ。

## なぜ必要か

API 呼び出しと認証は Astro の SSR サーバーが行うので、ブラウザが PocketBase に触れることはない。
唯一の例外が画像で、`<img src>` は必ずブラウザから直接取得される。

そこで `www.akarinext.org/api/files/*` を PocketBase に転送し、画像を同一ドメインから配信する。

```
ブラウザ ──> www.akarinext.org/             ──> Astro SSR ──(内部ネットワーク)──> PocketBase
        ──> www.akarinext.org/api/files/... ──> Traefik   ──(内部ネットワーク)──> PocketBase
```

Astro を経由しないので、画像のトラフィックは SSR サーバーの負荷にならず、CDN キャッシュもそのまま効く。

パスを PocketBase と同じ `/api/files` に揃えているため、**プロキシ側でのパス書き換えは不要**。
Dokploy なら Domain を1つ追加するだけで済む。

Astro 側の API ルートは `/api/server-status` だけなので衝突しない。
今後 `/api/files` 配下にルートを足さないこと。

## 環境変数

| 変数 | 値 | 種類 |
| --- | --- | --- |
| `POCKETBASE_URL` | `http://<PocketBase の Swarm サービス名>:8090` | ランタイム |
| `PUBLIC_MEDIA_BASE` | `/api/files` | **ビルド時**（クライアントに埋め込まれる） |

`PUBLIC_MEDIA_BASE` をランタイム env にだけ設定しても反映されない。
Dokploy では **Build Args** 側に設定し、再ビルドすること。

## Dokploy での手順

PocketBase・フロントエンドとも `Dockerfile` ビルドの Application として動かす前提。

### 1. PocketBase のサービス名を確認

PocketBase は `backend/Dockerfile` からビルドされる Dokploy の Application として動き、
フロントエンドと同じ overlay ネットワーク `dokploy-network` に属する。
Swarm のサービス名がそのまま DNS 名になる。

```bash
docker service ls | grep -i pocketbase
```

### 2. PocketBase に画像用の Domain を追加

PocketBase アプリの Domains に、管理用とは別にもう1つ追加する:

| 項目 | 値 |
| --- | --- |
| Host | `www.akarinext.org` |
| Path | `/api/files` |
| Container Port | `8090` |
| HTTPS | 有効 |

Traefik はルールの文字列長で優先度を決めるため、`/api/files` を含むルーターが
Astro 側の `/` より優先される。ミドルウェアの設定は要らない。

### 3. フロントエンドの環境変数

- Build Args: `PUBLIC_MEDIA_BASE=/api/files`
- 環境変数（ランタイム）: `POCKETBASE_URL=http://<手順1で確認したサービス名>:8090`

Build Args を変えたら再ビルドが必要。

### 4. 確認

```bash
curl -I https://www.akarinext.org/api/files/<collection>/<record-id>/<filename>
```

`200` と `Content-Type: image/*` が返れば正しい。
サムネイル（`?thumb=100x100`）もクエリがそのまま転送されるので動く。

### 5. PocketBase の管理用ドメインを外す

4 が通ってから `pb.akarinext.org` を削除する。順序を逆にすると画像が落ちる。

削除すると管理画面 `/_/` にブラウザから到達できなくなる。管理はサーバー上でポートを転送して行う:

```bash
ssh -L 8090:127.0.0.1:18090 <サーバー>
# 別途サーバー側で: docker run --rm --network dokploy-network -p 18090:18090 alpine/socat \
#   tcp-listen:18090,fork,reuseaddr tcp-connect:<サービス名>:8090
# http://localhost:8090/_/ を開く
```

`pb.akarinext.org` を残したまま Traefik の Basic 認証や IP 許可リストで絞る選択肢もある。
シリーズ機能などスキーマ変更の頻度を考えると、当面は残しておく方が扱いやすい。

## 他のリバースプロキシ

パスを揃えているので、素直な `proxy_pass` で足りる。

### Caddy

```
www.akarinext.org {
	handle /api/files/* {
		reverse_proxy pocketbase:8090
	}
	handle {
		reverse_proxy astro:4321
	}
}
```

### nginx

```nginx
location /api/files/ {
	proxy_pass http://pocketbase:8090/api/files/;
	proxy_set_header Host $host;
}
```

## ローカル開発

プロキシを立てないので、`.env` で PocketBase を直接指す:

```
POCKETBASE_URL=http://localhost:8090
PUBLIC_MEDIA_BASE=http://localhost:8090/api/files
```

`PUBLIC_MEDIA_BASE` が絶対 URL でも相対パスでも、画像 URL の組み立て方は変わらない。
