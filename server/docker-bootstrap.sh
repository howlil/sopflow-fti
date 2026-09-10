#!/bin/sh
set -eu

BASELINE_MIGRATION="0_fti_native_baseline"

redact_output() {
  printf '%s\n' "$1" | sed -E 's#(://[^:[:space:]]+:)[^@[:space:]]+@#\1***@#g'
}

prepare_existing_baseline() {
  echo "Checking database baseline state"
  set +e
  node dist/src/database/migration/prepare-existing-baseline.js
  baseline_status=$?
  set -e

  case "$baseline_status" in
    0)
      return 0
      ;;
    42)
      echo "Adopting verified existing database into ${BASELINE_MIGRATION}"
      ./node_modules/.bin/prisma migrate resolve --applied "$BASELINE_MIGRATION"
      ;;
    *)
      echo "Database is not safe for automatic baseline adoption" >&2
      return "$baseline_status"
      ;;
  esac
}

run_migrations() {
  echo "Applying database migrations"
  set +e
  migration_output="$(./node_modules/.bin/prisma migrate deploy 2>&1)"
  migration_status=$?
  set -e
  redact_output "$migration_output"
  return "$migration_status"
}

prepare_existing_baseline
run_migrations
node dist/src/database/seed/seed-initial.js

echo "Database bootstrap completed"
