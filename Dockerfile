# Build stage
FROM node:22-alpine AS builder

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
ARG PUBLIC_STRAPI_URL
ENV PUBLIC_STRAPI_URL=${PUBLIC_STRAPI_URL}

RUN pnpm run build
RUN pnpm run build:monitor

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
# Only install production dependencies
# Only install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create cache directory and volume for persistence
RUN mkdir -p /app/.cache
VOLUME ["/app/.cache"]

# Expose Astro's default port (or Dokploy's PORT env)
ARG PUBLIC_STRAPI_URL
ENV HOST=0.0.0.0
ENV PORT=4321
ENV PUBLIC_STRAPI_URL=${PUBLIC_STRAPI_URL}
EXPOSE 4321

# Start SSR server and monitor concurrently
CMD ["pnpm", "run", "start:all"]
