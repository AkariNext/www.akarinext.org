# ベースイメージ
FROM node:lts-buster-slim as base

WORKDIR /usr/server

# 依存関係のインストールとキャッシュ
COPY package.json pnpm-lock.yaml ./
RUN corepack enable
RUN pnpm fetch

# ビルドステージ
FROM base as build

WORKDIR /usr/server

# 残りのソースコードをコピー
COPY ./ ./

# インストールされた依存関係をリンク
RUN pnpm install --offline

# ビルド
ENV NODE_ENV=production
RUN pnpm build

# 最終ステージ
FROM node:lts-buster-slim as final

WORKDIR /usr/server

# pnpmをインストール
RUN corepack enable

# ビルド成果物をコピー
COPY --from=build /usr/server /usr/server

# アプリケーションの起動
CMD ["pnpm", "start"]