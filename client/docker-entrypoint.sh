#!/bin/sh
set -e

node /app/production-server.mjs &
SSR_PID=$!
SSR_PORT="${SSR_PORT:-4173}"

# Healthy SSR normally binds in well under a second. Poll quickly so a good
# cold start is not rounded up by 1s sleeps, while a broken image fails in
# roughly 10s instead of hanging for a full minute.
i=0
while [ "$i" -lt 50 ]; do
  if wget -q -O /dev/null "http://127.0.0.1:${SSR_PORT}/" 2>/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 0.2
done

if ! wget -q -O /dev/null "http://127.0.0.1:${SSR_PORT}/" 2>/dev/null; then
  echo "SSR server failed to start within 10s" >&2
  kill "$SSR_PID" 2>/dev/null || true
  exit 1
fi

cleanup() {
  kill "$SSR_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

exec nginx -g 'daemon off;'
