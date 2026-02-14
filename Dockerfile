# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build-time env (override with Dokploy env vars)
# 403 が出る場合: PUBLIC_SKIP_DIRECTUS_BUILD=true で Directus fetch をスキップ
ARG PUBLIC_DIRECTUS_URL
ARG PUBLIC_SKIP_DIRECTUS_BUILD
ENV PUBLIC_DIRECTUS_URL=${PUBLIC_DIRECTUS_URL}
ENV PUBLIC_SKIP_DIRECTUS_BUILD=${PUBLIC_SKIP_DIRECTUS_BUILD}

RUN pnpm run build
RUN pnpm run build:monitor

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
# Only install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose Astro's default port (or Dokploy's PORT env)
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Start SSR server and monitor concurrently
CMD ["pnpm", "run", "start:all"]
