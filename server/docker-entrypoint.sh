#!/bin/sh
set -eu

database_host="${DATABASE_HOST:-localhost}"
database_port="${DATABASE_PORT:-3306}"
startup_timeout_seconds="${DATABASE_STARTUP_TIMEOUT_SECONDS:-300}"
retry_seconds="${DATABASE_STARTUP_RETRY_SECONDS:-2}"

case "$database_port" in
  ''|*[!0-9]*)
    echo "DATABASE_PORT must be a number" >&2
    exit 1
    ;;
esac
if [ "$database_port" -lt 1 ] || [ "$database_port" -gt 65535 ]; then
  echo "DATABASE_PORT must be between 1 and 65535" >&2
  exit 1
fi

case "$startup_timeout_seconds" in
  ''|*[!0-9]*)
    echo "DATABASE_STARTUP_TIMEOUT_SECONDS must be a number" >&2
    exit 1
    ;;
esac
case "$retry_seconds" in
  ''|*[!0-9]*)
    echo "DATABASE_STARTUP_RETRY_SECONDS must be a number" >&2
    exit 1
    ;;
esac
if [ "$retry_seconds" -lt 1 ]; then
  echo "DATABASE_STARTUP_RETRY_SECONDS must be at least 1" >&2
  exit 1
fi

max_attempts=$((startup_timeout_seconds / retry_seconds))
if [ "$max_attempts" -lt 1 ]; then
  max_attempts=1
fi

database_is_reachable() {
  node -e '
    const net = require("node:net");
    const host = process.argv[1];
    const port = Number(process.argv[2]);
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      process.exit(code);
    };
    socket.once("connect", () => finish(0));
    socket.once("error", () => finish(1));
    socket.setTimeout(3000, () => finish(1));
  ' "$database_host" "$database_port" >/dev/null 2>&1
}

wait_for_database() {
  attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    if database_is_reachable; then
      echo "Database TCP connection is ready at ${database_host}:${database_port}"
      return 0
    fi

    if [ "$attempt" -eq "$max_attempts" ]; then
      break
    fi
    echo "Waiting for database at ${database_host}:${database_port} (attempt ${attempt}/${max_attempts})"
    attempt=$((attempt + 1))
    sleep "$retry_seconds"
  done

  echo "Database did not become reachable at ${database_host}:${database_port} within ${startup_timeout_seconds}s" >&2
  return 1
}

print_migration_output() {
  # Prisma diagnostics are useful in deployment logs, but redact URL passwords
  # defensively in case a future Prisma version includes a connection URL.
  printf '%s\n' "$1" | sed -E 's#(://[^:[:space:]]+:)[^@[:space:]]+@#\1***@#g'
}

run_migrations() {
  attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "Running database migrations (attempt ${attempt}/${max_attempts})"
    set +e
    migration_output="$(./node_modules/.bin/prisma migrate deploy 2>&1)"
    migration_status=$?
    set -e
    print_migration_output "$migration_output"

    if [ "$migration_status" -eq 0 ]; then
      return 0
    fi

    # Retry only transient database reachability failures. Migration errors
    # such as P3009/P3018 must stop immediately for explicit recovery.
    case "$migration_output" in
      *P1001*|*P1002*|*"Can't reach database server"*)
        if [ "$attempt" -eq "$max_attempts" ]; then
          break
        fi
        attempt=$((attempt + 1))
        sleep "$retry_seconds"
        ;;
      *)
        return "$migration_status"
        ;;
    esac
  done

  echo "Database migrations did not become reachable within ${startup_timeout_seconds}s" >&2
  return 1
}

wait_for_database
run_migrations
node dist/src/database/seed/seed-initial.js
exec node dist/src/main.js
