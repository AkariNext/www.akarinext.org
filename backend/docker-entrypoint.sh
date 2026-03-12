#!/bin/sh
set -eu

# /app/public/uploads は Dokploy / docker-compose のボリュームとしてマウントされる想定。
# ボリュームは root 所有になりがちなので、起動時に node に chown してから降格する。

UPLOADS_DIR="/app/public/uploads"
TMP_DIR="/app/.tmp"
CACHE_DIR="/app/.cache"

mkdir -p "$UPLOADS_DIR" "$TMP_DIR" "$CACHE_DIR"

if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$UPLOADS_DIR" "$TMP_DIR" "$CACHE_DIR" || true
  exec su-exec node "$@"
fi

exec "$@"

