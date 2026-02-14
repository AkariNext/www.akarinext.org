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
# 403 が出る場合: PUBLIC_SKIP_DIRECTUS_BUILD=true で Directus fetch をスキップ
ARG PUBLIC_DIRECTUS_URL
ARG PUBLIC_SKIP_DIRECTUS_BUILD
ENV PUBLIC_DIRECTUS_URL=${PUBLIC_DIRECTUS_URL}
ENV PUBLIC_SKIP_DIRECTUS_BUILD=${PUBLIC_SKIP_DIRECTUS_BUILD}

RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built assets from Astro
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA-style routing (optional, for client-side routing)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
