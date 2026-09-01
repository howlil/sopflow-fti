#!/usr/bin/env bash
set -euo pipefail

MIGRATION_NAME="20260901163000_add_fti_process_foundation"
MODE="${1:---inspect}"

if [[ "$MODE" != "--inspect" && "$MODE" != "--apply" ]]; then
  echo "usage: bash $0 [--inspect|--apply]" >&2
  exit 64
fi

compose=(docker compose)

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

info() {
  printf '[recovery] %s\n' "$*"
}

db_scalar() {
  local query="$1"
  "${compose[@]}" exec -T -e "RECOVERY_SQL=$query" db sh -lc \
    'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE" -Nse "$RECOVERY_SQL"' \
    | tr -d '\r'
}

db_exec() {
  local sql="$1"
  printf '%s\n' "$sql" | "${compose[@]}" exec -T db sh -lc \
    'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"'
}

prisma() {
  "${compose[@]}" run --rm --no-deps backend pnpm prisma "$@"
}

expect_eq() {
  local actual="$1"
  local expected="$2"
  local message="$3"
  [[ "$actual" == "$expected" ]] || fail "$message (expected=$expected actual=$actual)"
}

info "checking Compose database availability"
"${compose[@]}" exec -T db healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 \
  || fail "database service is not healthy"

failed_row="$(db_scalar "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='${MIGRATION_NAME}' AND finished_at IS NULL AND rolled_back_at IS NULL")"
expect_eq "$failed_row" "1" "expected exactly one unresolved failed ${MIGRATION_NAME} row"

platform_role_exists="$(db_scalar "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Pengguna' AND COLUMN_NAME='platformRole'")"
platform_role_index_exists="$(db_scalar "SELECT COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Pengguna' AND INDEX_NAME='Pengguna_platformRole_deletedAt_idx'")"
department_exists="$(db_scalar "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Department'")"
process_exists="$(db_scalar "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Process'")"
process_member_exists="$(db_scalar "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ProcessMember'")"
trigger_count="$(db_scalar "SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME IN ('trg_process_scope_department_insert','trg_process_scope_department_update')")"

info "partial state: platformRole=$platform_role_exists platformRoleIndex=$platform_role_index_exists Department=$department_exists Process=$process_exists ProcessMember=$process_member_exists scopeTriggers=$trigger_count"

if [[ "$platform_role_exists" == "1" ]]; then
  platform_role_type="$(db_scalar "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Pengguna' AND COLUMN_NAME='platformRole'")"
  [[ "$platform_role_type" == "enum('SUPER_ADMIN','USER')" ]] \
    || fail "Pengguna.platformRole has unexpected type: $platform_role_type"
elif [[ "$platform_role_exists" != "0" ]]; then
  fail "unexpected Pengguna.platformRole metadata count: $platform_role_exists"
fi

if [[ "$department_exists" == "1" ]]; then
  department_columns="$(db_scalar "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Department' AND COLUMN_NAME IN ('departmentId','nama','createdAt','updatedAt')")"
  expect_eq "$department_columns" "4" "existing Department table has an unexpected column shape"
  department_pk="$(db_scalar "SELECT COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Department' AND INDEX_NAME='PRIMARY'")"
  expect_eq "$department_pk" "1" "existing Department table has no expected primary key"
  department_name_key="$(db_scalar "SELECT COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Department' AND INDEX_NAME='Department_nama_key' AND NON_UNIQUE=0")"
  expect_eq "$department_name_key" "1" "existing Department table has no expected nama unique index"
elif [[ "$department_exists" != "0" ]]; then
  fail "unexpected Department table metadata count: $department_exists"
fi

if [[ "$process_exists" == "1" ]]; then
  process_columns="$(db_scalar "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Process' AND COLUMN_NAME IN ('processId','nama','scope','departmentId','ownerId','createdAt','updatedAt')")"
  expect_eq "$process_columns" "7" "existing Process table has an unexpected column shape"

  invalid_process_rows="$(db_scalar "SELECT COUNT(*) FROM \`Process\` WHERE (scope='FACULTY' AND departmentId IS NOT NULL) OR (scope='DEPARTMENT' AND departmentId IS NULL)")"
  expect_eq "$invalid_process_rows" "0" "existing Process data violates scope/department invariant"

  process_fk_count="$(db_scalar "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='Process' AND CONSTRAINT_NAME IN ('Process_departmentId_fkey','Process_ownerId_fkey')")"
  expect_eq "$process_fk_count" "2" "existing Process table is partial/ambiguous; refusing automatic repair"
elif [[ "$process_exists" != "0" ]]; then
  fail "unexpected Process table metadata count: $process_exists"
fi

if [[ "$process_member_exists" == "1" ]]; then
  process_member_columns="$(db_scalar "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ProcessMember' AND COLUMN_NAME IN ('processId','penggunaId','createdAt')")"
  expect_eq "$process_member_columns" "3" "existing ProcessMember table has an unexpected column shape"

  process_member_fk_count="$(db_scalar "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ProcessMember' AND CONSTRAINT_NAME IN ('ProcessMember_processId_fkey','ProcessMember_penggunaId_fkey')")"
  expect_eq "$process_member_fk_count" "2" "existing ProcessMember table is partial/ambiguous; refusing automatic repair"
elif [[ "$process_member_exists" != "0" ]]; then
  fail "unexpected ProcessMember table metadata count: $process_member_exists"
fi

if [[ "$MODE" == "--inspect" ]]; then
  info "inspection passed; rerun with --apply to repair and resolve ${MIGRATION_NAME}"
  exit 0
fi

info "verifying backend image contains the fixed trigger-based migration"
"${compose[@]}" run --rm --no-deps backend sh -lc \
  "grep -q 'trg_process_scope_department_insert' prisma/migrations/${MIGRATION_NAME}/migration.sql" \
  || fail "backend image still contains the old failing migration; rebuild/update it before recovery"

if [[ "$platform_role_exists" == "0" ]]; then
  info "adding Pengguna.platformRole"
  db_exec "ALTER TABLE \`Pengguna\` ADD COLUMN \`platformRole\` ENUM('SUPER_ADMIN','USER') NOT NULL DEFAULT 'USER' AFTER \`peran\`;"
fi

if [[ "$platform_role_index_exists" == "0" ]]; then
  info "adding Pengguna platform-role index"
  db_exec "ALTER TABLE \`Pengguna\` ADD INDEX \`Pengguna_platformRole_deletedAt_idx\` (\`platformRole\`, \`deletedAt\`);"
elif [[ "$platform_role_index_exists" != "1" ]]; then
  fail "unexpected platform-role index metadata count: $platform_role_index_exists"
fi

if [[ "$department_exists" == "0" ]]; then
  info "creating Department"
  db_exec "CREATE TABLE \`Department\` (\n  \`departmentId\` CHAR(36) NOT NULL,\n  \`nama\` VARCHAR(100) NOT NULL,\n  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n  \`updatedAt\` DATETIME(3) NOT NULL,\n  PRIMARY KEY (\`departmentId\`),\n  UNIQUE INDEX \`Department_nama_key\` (\`nama\`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

if [[ "$process_exists" == "0" ]]; then
  info "creating Process with valid FK actions"
  db_exec "CREATE TABLE \`Process\` (\n  \`processId\` CHAR(36) NOT NULL,\n  \`nama\` VARCHAR(120) NOT NULL,\n  \`scope\` ENUM('FACULTY','DEPARTMENT') NOT NULL,\n  \`departmentId\` CHAR(36) NULL,\n  \`ownerId\` CHAR(36) NOT NULL,\n  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n  \`updatedAt\` DATETIME(3) NOT NULL,\n  PRIMARY KEY (\`processId\`),\n  INDEX \`Process_scope_departmentId_idx\` (\`scope\`, \`departmentId\`),\n  INDEX \`Process_ownerId_idx\` (\`ownerId\`),\n  CONSTRAINT \`Process_departmentId_fkey\` FOREIGN KEY (\`departmentId\`) REFERENCES \`Department\`(\`departmentId\`) ON DELETE RESTRICT ON UPDATE CASCADE,\n  CONSTRAINT \`Process_ownerId_fkey\` FOREIGN KEY (\`ownerId\`) REFERENCES \`Pengguna\`(\`penggunaId\`) ON DELETE RESTRICT ON UPDATE CASCADE\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

info "installing Process scope triggers"
cat <<'SQL' | "${compose[@]}" exec -T db sh -lc \
  'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"'
DELIMITER $$
DROP TRIGGER IF EXISTS `trg_process_scope_department_insert`$$
CREATE TRIGGER `trg_process_scope_department_insert` BEFORE INSERT ON `Process` FOR EACH ROW
BEGIN
  IF (NEW.`scope` = 'FACULTY' AND NEW.`departmentId` IS NOT NULL) OR (NEW.`scope` = 'DEPARTMENT' AND NEW.`departmentId` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process scope and departmentId are inconsistent';
  END IF;
END$$
DROP TRIGGER IF EXISTS `trg_process_scope_department_update`$$
CREATE TRIGGER `trg_process_scope_department_update` BEFORE UPDATE ON `Process` FOR EACH ROW
BEGIN
  IF (NEW.`scope` = 'FACULTY' AND NEW.`departmentId` IS NOT NULL) OR (NEW.`scope` = 'DEPARTMENT' AND NEW.`departmentId` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process scope and departmentId are inconsistent';
  END IF;
END$$
DELIMITER ;
SQL

if [[ "$process_member_exists" == "0" ]]; then
  info "creating ProcessMember"
  db_exec "CREATE TABLE \`ProcessMember\` (\n  \`processId\` CHAR(36) NOT NULL,\n  \`penggunaId\` CHAR(36) NOT NULL,\n  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n  PRIMARY KEY (\`processId\`, \`penggunaId\`),\n  INDEX \`ProcessMember_penggunaId_idx\` (\`penggunaId\`),\n  CONSTRAINT \`ProcessMember_processId_fkey\` FOREIGN KEY (\`processId\`) REFERENCES \`Process\`(\`processId\`) ON DELETE CASCADE ON UPDATE CASCADE,\n  CONSTRAINT \`ProcessMember_penggunaId_fkey\` FOREIGN KEY (\`penggunaId\`) REFERENCES \`Pengguna\`(\`penggunaId\`) ON DELETE RESTRICT ON UPDATE CASCADE\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

info "verifying repaired migration end-state"
expect_eq "$(db_scalar "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME IN ('Process_departmentId_fkey','Process_ownerId_fkey','ProcessMember_processId_fkey','ProcessMember_penggunaId_fkey')")" "4" "Process foundation FK verification failed"
expect_eq "$(db_scalar "SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME IN ('trg_process_scope_department_insert','trg_process_scope_department_update')")" "2" "Process scope trigger verification failed"
expect_eq "$(db_scalar "SELECT COUNT(*) FROM \`Process\` WHERE (scope='FACULTY' AND departmentId IS NOT NULL) OR (scope='DEPARTMENT' AND departmentId IS NULL)")" "0" "Process scope data invariant verification failed"

set +e
invalid_insert_output="$(db_scalar "SET FOREIGN_KEY_CHECKS=0; INSERT INTO \`Process\` (processId,nama,scope,departmentId,ownerId,createdAt,updatedAt) VALUES ('00000000-0000-0000-0000-000000000003','Recovery Invalid','FACULTY','00000000-0000-0000-0000-000000000098','00000000-0000-0000-0000-000000000099',NOW(3),NOW(3));" 2>&1)"
invalid_insert_status=$?
set -e
[[ "$invalid_insert_status" -ne 0 ]] || fail "Process scope trigger did not reject invalid INSERT"
printf '%s\n' "$invalid_insert_output" | grep -q 'Process scope and departmentId are inconsistent' \
  || fail "invalid INSERT failed for an unexpected reason"

info "marking ${MIGRATION_NAME} applied after verified fix-forward"
prisma migrate resolve --applied "$MIGRATION_NAME"

info "verifying failed migration history is resolved"
expect_eq "$(db_scalar "SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name='${MIGRATION_NAME}' AND finished_at IS NULL AND rolled_back_at IS NULL")" "0" "failed migration row remains unresolved after migrate resolve"

info "applying remaining migrations"
prisma migrate deploy

info "verifying final migration status"
prisma migrate status

info "recovery complete; migration history is unblocked"
