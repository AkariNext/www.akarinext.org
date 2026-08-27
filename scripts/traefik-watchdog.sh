#!/bin/sh
# Traefik が止まっていたら起動し直す。
#
# なぜ必要か:
#   Traefik は Dokploy 管理下だが Swarm service ではなく単独コンテナで動いている。
#   そのため Swarm の自己修復が効かない。さらに `restart: always` は
#   「明示的に docker stop された場合は再起動しない」という Docker の仕様があり、
#   Dokploy の更新処理などで止められるとそのまま放置される。
#   Traefik はサーバー上の全サイトの唯一の入口なので、止まったままだと
#   すべてのドメインが 502 を返し続ける。
#
# 設置:
#   crontab -e で以下を追加（docker グループに属するユーザーで実行すること）
#     * * * * * /home/yupix/bin/traefik-watchdog.sh
#
# 環境変数:
#   TRAEFIK_CONTAINER       対象コンテナ名（既定: dokploy-traefik）
#   WATCHDOG_LOG            ログの出力先（既定: $HOME/traefik-watchdog.log）
#   DISCORD_WEBHOOK_ALERTS  設定すると復旧・失敗を Discord に通知する

set -eu

# cron から呼ばれると PATH が最小限になるため補っておく
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export PATH

CONTAINER="${TRAEFIK_CONTAINER:-dokploy-traefik}"
LOG="${WATCHDOG_LOG:-$HOME/traefik-watchdog.log}"
WEBHOOK="${DISCORD_WEBHOOK_ALERTS:-}"

log() {
	echo "$(date -Is) $*" >>"$LOG"
}

# メッセージは固定文言 + コンテナ状態（英数字のみ）で組み立てるため、
# JSON のエスケープは考慮しない
notify() {
	[ -n "$WEBHOOK" ] || return 0
	curl -sS -m 10 -X POST -H "Content-Type: application/json" \
		-d "{\"content\": \"$1\"}" "$WEBHOOK" >/dev/null 2>&1 ||
		log "Discord への通知に失敗"
}

# docker inspect は対象が無いと空を返すことがあるので、空白を落として判定する
state="$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null | head -n1 | tr -d '[:space:]')"
[ -n "$state" ] || state="missing"

# 正常時は何も記録しない。毎分動かすのでログを膨らませないため
if [ "$state" = "running" ]; then
	exit 0
fi

if [ "$state" = "missing" ]; then
	log "$CONTAINER が存在しない。Dokploy 側での再作成が必要"
	notify "⚠️ $CONTAINER が存在しません。Dokploy から再作成してください"
	exit 1
fi

log "$CONTAINER が $state のため起動を試みる"
if ! docker start "$CONTAINER" >/dev/null 2>&1; then
	log "docker start に失敗"
	notify "🚨 $CONTAINER の起動に失敗しました（状態: $state）"
	exit 1
fi

# 起動直後に落ちる場合があるので、少し待ってから確認する
sleep 5
after="$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null | head -n1 | tr -d '[:space:]')"
[ -n "$after" ] || after="unknown"
if [ "$after" = "running" ]; then
	log "起動に成功（直前の状態: $state）"
	notify "🔧 $CONTAINER が停止していたため起動しました（直前の状態: $state）"
else
	log "起動したが $after になっている"
	notify "🚨 $CONTAINER を起動しましたが $after になりました"
	exit 1
fi
