# Strapi backend (Node 20 LTS)
FROM node:20-alpine AS base
ARG NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存インストール
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ビルド
FROM base AS builder
ARG NODE_ENV=production
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

ENV NODE_ENV=${NODE_ENV}
ENV HOST=${HOST}
ENV PORT=${PORT}

EXPOSE ${PORT}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
# Strapi プロジェクト一式を builder からコピー（/app 配下にそのまま展開）
COPY --from=builder /app ./

# アップロード保存先を用意し node に権限付与（EACCES 防止）
RUN mkdir -p /app/public/uploads /app/.tmp /app/.cache && chown -R node:node /app/public /app/.tmp /app/.cache

# 永続化: 実行時に -v や compose の volumes でマウントすること
VOLUME ["/app/public/uploads"]

USER node
CMD ["pnpm", "run", "start"]
