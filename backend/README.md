# Strapi CMS (backend)

このリポジトリの CMS は Strapi です。Dokploy などで Self-host する想定です。

## Dokploy でデプロイするときの環境変数

Dokploy のアプリ設定で **Environment Variables** に以下を追加する。

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `HOST` | - | `0.0.0.0`（コンテナ内で全インターフェースを listen） |
| `PORT` | - | `1337`（Dockerfile と揃える） |
| `APP_KEYS` | ✅ | カンマ区切り 4 つ。`node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"` で生成した値を並べる |
| `API_TOKEN_SALT` | ✅ | ランダム文字列 |
| `ADMIN_JWT_SECRET` | ✅ | ランダム文字列 |
| `TRANSFER_TOKEN_SALT` | ✅ | ランダム文字列 |
| `JWT_SECRET` | ✅ | ランダム文字列 |
| `ENCRYPTION_KEY` | ✅ | ランダム文字列 |
| `DATABASE_URL` | ✅ | Postgres の接続文字列。例: `postgres://user:password@postgres:5432/strapi`（Dokploy で Postgres をリンクした場合はサービス名をホストに） |

**アップロードの永続化（Docker / Dokploy）:** コンテナ再作成でアップロードが消えないよう、`/app/public/uploads` をボリュームでマウントすること。Dokploy なら「Volumes」でコンテナパス `/app/public/uploads` にボリュームまたはホストパスを割り当てる。  
**注意:** ボリュームは初期状態で root 所有になりがちで、`USER node` のままだと `EACCES` になります。この Dockerfile は起動時（entrypoint）に root で `uploads/.tmp/.cache` を `chown` してから node に降ろすため、通常は追加対応不要です（ただし Dokploy 側でユーザーを強制的に変更している場合は別途権限調整が必要）。

**秘密鍵の一括生成例（PowerShell）:**

```powershell
1..5 | ForEach-Object { node -e "console.log(require('crypto').randomBytes(16).toString('base64'))" }
```

出た 5 行のうち 4 つを `APP_KEYS` にカンマ区切りで、残りをそれぞれ `API_TOKEN_SALT` / `ADMIN_JWT_SECRET` 等に割り当てる。

## 管理者と作者の違い

- **管理者** … Strapi の管理画面（`/admin`）にログインできる人。Content-Type の編集・コンテンツの作成・ユーザー管理などができる。作者である必要はない。
- **作者** … 記事（Post）の「著者」として表示される人。**Users & Permissions の「User」** を作者として使っている。User に name / avatar / bio / is_staff / playing_games などを拡張している。
- 同じ人が「管理者かつ作者」の場合 … 管理用の Admin アカウントと、サイト用の User（作者）を 1 人につき 1 つずつ作る形になる。記事作成時に「作者」としてその User を選ぶ。

フロントから作者一覧・プロフィールを読むには、Strapi 管理画面で **Settings > Users & Permissions > User** の **find / findOne** を **Public** に許可すること。

## Payload からのデータ移行

既存の Payload CMS データを Strapi に移行する場合:

1. Payload が動作している状態で、Strapi を起動する。
2. 環境変数を設定する:
   - `PAYLOAD_URL` … Payload API のベース URL（例: `http://localhost:3000`）
   - `STRAPI_URL` … Strapi API のベース URL（例: `http://localhost:1337`）
   - `STRAPI_API_TOKEN` … Strapi 管理画面（Settings > API Tokens）で発行したトークン
3. 以下を実行する:

```bash
cd backend
pnpm run migrate:payload
```

---

# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
