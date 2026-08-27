# Build stage
FROM node:26-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files（pnpm-workspace.yaml の onlyBuiltDependencies を効かせるため同梱）
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build-time env (override with Dokploy env vars)
# PUBLIC_ 付きの値はクライアントバンドルに埋め込まれるため、ビルド時に渡す必要がある
ARG PUBLIC_MEDIA_BASE
ENV PUBLIC_MEDIA_BASE=${PUBLIC_MEDIA_BASE}

RUN pnpm run build
RUN pnpm run build:monitor

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN npm install -g pnpm

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/dist ./dist
# Only install production dependencies
# Only install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create cache directory and volume for persistence
RUN mkdir -p /app/.cache
VOLUME ["/app/.cache"]

# Expose Astro's default port (or Dokploy's PORT env)
# POCKETBASE_URL はランタイム env で渡す（サーバー側でしか読まないため埋め込み不要）
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Start SSR server and monitor concurrently
CMD ["pnpm", "run", "start:all"]
