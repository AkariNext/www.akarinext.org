# Strapi backend (Node 20 LTS)
# 公式 https://docs.strapi.io/dev-docs/installation/docker を参考に /app 構成で構成
FROM node:20-alpine AS base
ARG NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存インストール
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ビルド（ネイティブモジュール・画像処理用にビルドツールと vips を追加）
FROM base AS builder
ARG NODE_ENV=production
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY . .
ENV NODE_ENV=${NODE_ENV}
RUN pnpm run build

# 本番イメージ
# 秘密情報（APP_KEYS, JWT_SECRET, DATABASE_URL など）はビルド時に含めず、
# 実行時に Dokploy / docker run / compose の環境変数で渡すこと（SecretsUsedInArgOrEnv 対策）
FROM base AS runner
ARG NODE_ENV=production
ARG HOST=0.0.0.0
ARG PORT=1337

RUN apk add --no-cache vips-dev
ENV NODE_ENV=${NODE_ENV}
ENV HOST=${HOST}
ENV PORT=${PORT}
ENV PATH=/app/node_modules/.bin:$PATH

EXPOSE ${PORT}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# builder からは node_modules をコピーせず、必要な成果物だけコピー（COPY 時間短縮）
COPY --from=builder /app/build ./build
COPY --from=builder /app/config ./config
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/database ./database
COPY --from=builder /app/favicon.png ./favicon.png
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# アップロード保存先を用意（公式同様に /app 全体を node に）
RUN mkdir -p /app/public/uploads /app/.tmp /app/.cache && chown -R node:node /app

# 永続化: 実行時に -v や compose の volumes でマウントすること
VOLUME ["/app/public/uploads"]

USER node
CMD ["pnpm", "run", "start"]
