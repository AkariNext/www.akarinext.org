# Strapi backend (Node 20 LTS)
# Strapi 公式の Docker 例に寄せた構成（/opt 相当を /app に）
FROM node:20-alpine AS base
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- production dependencies only (runner に渡す node_modules) ---
FROM base AS prod-deps
RUN apk add --no-cache vips-dev
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- build stage (admin build 等) ---
FROM base AS build
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
# app を丸ごと COPY しやすいように、重い node_modules はここで落としておく
RUN rm -rf node_modules

# --- runtime image ---
# 秘密情報（APP_KEYS, JWT_SECRET, DATABASE_URL など）はビルド時に含めず、
# 実行時に Dokploy / docker run / compose の環境変数で渡すこと（SecretsUsedInArgOrEnv 対策）
FROM base AS runner
ARG HOST=0.0.0.0
ARG PORT=1337

RUN apk add --no-cache vips-dev su-exec
ENV HOST=${HOST}
ENV PORT=${PORT}
ENV PATH=/app/node_modules/.bin:$PATH

EXPOSE ${PORT}

# 公式の "COPY node_modules" 方式に寄せる（ただし pnpm なので prod-deps から）
COPY --from=prod-deps /app/node_modules ./node_modules

# アプリ本体は build から丸ごとコピー（node_modules は除外済み）
COPY --from=build /app ./

# アップロード用ボリュームは起動時 entrypoint で chown する
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 永続化: 実行時に -v や compose の volumes でマウントすること
VOLUME ["/app/public/uploads"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start"]
