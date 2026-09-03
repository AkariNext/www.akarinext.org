# PocketBase backend（Dokploy などでそのままデプロイ可能）
FROM alpine:3.24

ARG PB_VERSION=0.39.7

RUN apk add --no-cache ca-certificates unzip

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

# スキーマ（マイグレーション）と Discord 通知フック
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

# データは /pb/pb_data に永続化する（ボリュームをマウントすること）
VOLUME ["/pb/pb_data"]

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s \
	CMD wget -q --spider http://127.0.0.1:8090/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks"]
