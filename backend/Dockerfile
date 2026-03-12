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

# 本番イメージ（.env.example の変数を ARG で受け取り ENV に渡す）
FROM base AS runner
ARG NODE_ENV=production
ARG HOST=0.0.0.0
ARG PORT=1337
ARG APP_KEYS
ARG API_TOKEN_SALT
ARG ADMIN_JWT_SECRET
ARG TRANSFER_TOKEN_SALT
ARG JWT_SECRET
ARG ENCRYPTION_KEY
ARG DATABASE_URL
ARG PUBLIC_URL

ENV NODE_ENV=${NODE_ENV}
ENV HOST=${HOST}
ENV PORT=${PORT}
ENV APP_KEYS=${APP_KEYS}
ENV API_TOKEN_SALT=${API_TOKEN_SALT}
ENV ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
ENV TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}
ENV JWT_SECRET=${JWT_SECRET}
ENV ENCRYPTION_KEY=${ENCRYPTION_KEY}
ENV DATABASE_URL=${DATABASE_URL}
ENV PUBLIC_URL=${PUBLIC_URL}

EXPOSE ${PORT}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
# Strapi プロジェクト一式を builder からコピー（/app 配下にそのまま展開）
COPY --from=builder /app ./

USER node
CMD ["pnpm", "run", "start"]
