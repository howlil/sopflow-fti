# Prisma Migration Recovery

Use this runbook only for shared/staging/production databases where `prisma migrate deploy` reports a failed migration such as `P3018` or `P3009`.

The goal is to recover the migration history without resetting or silently rewriting existing data.

## Core Rule

A failed migration is a database-state incident, not a reason to reset the database.

Never run `prisma migrate reset` against a shared, staging, or production database.

Never delete or hand-edit rows in `_prisma_migrations` as a shortcut.

Do not repeatedly rerun `prisma migrate deploy` while Prisma reports an unresolved failed migration.

## Recovery Loop

```text
Inspect failed migration
  -> inspect actual database state
  -> choose fix-forward or rollback
  -> execute only the missing/repair SQL
  -> verify resulting schema/invariants
  -> prisma migrate resolve
  -> prisma migrate status
  -> prisma migrate deploy
```

## Incident Procedure — `20260901163000_add_fti_process_foundation`

Use the dedicated recovery script when this migration is the unresolved failed row and the deployment is blocked by the observed `3823` / `P3018` / `P3009` incident:

```sh
bash server/prisma/recovery/20260901163000_add_fti_process_foundation.sh --inspect
```

`--inspect` is read-only. It verifies the unresolved migration row and inspects the live partial schema. It fails closed when existing `Department`, `Process`, or `ProcessMember` structures are ambiguous rather than dropping or rewriting them.

Before applying recovery, ensure the backend image contains the fixed trigger-based migration. Rebuild/update the backend image when needed; the script also checks this and stops if the image still contains the old failing migration.

Apply the bounded fix-forward only after inspection succeeds:

```sh
bash server/prisma/recovery/20260901163000_add_fti_process_foundation.sh --apply
```

The script:

1. verifies the database service is healthy;
2. verifies exactly one unresolved failed row exists for this migration;
3. validates any already-applied `Pengguna.platformRole`, `Department`, `Process`, and `ProcessMember` state;
4. creates only missing Process-foundation objects required by the intended migration end-state;
5. installs the trigger-based Process scope invariant;
6. verifies all four Process/ProcessMember foreign keys and both scope triggers;
7. proves an invalid Process scope INSERT is rejected;
8. runs `prisma migrate resolve --applied 20260901163000_add_fti_process_foundation` only after end-state verification;
9. runs `prisma migrate status` and resumes `prisma migrate deploy` for remaining migrations.

The script does not run `migrate reset`, delete migration-history rows, drop existing domain tables, restart services, or deploy application images.

### 1. Identify the failed migration

```sh
pnpm prisma migrate status
```

Inspect the matching migration file and the `_prisma_migrations` row. Record which statement failed and whether earlier DDL statements already committed.

MySQL/MariaDB DDL is not assumed to be transactionally rolled back as a unit. A failed migration may therefore leave a partial schema.

### 2. Inspect the actual database state

Check the affected tables, columns, indexes, foreign keys, triggers, and data before running repair SQL.

Do not infer the current state solely from the migration file or from Prisma's error message.

### 3. Choose one recovery direction

Prefer **fix-forward** when earlier statements applied successfully and can safely remain. Execute only the missing or corrective SQL required to reach the intended migration end state.

Use **rollback** only when the already-applied portion can be reversed safely and unambiguously without destructive data loss.

A destructive rollback, ambiguous data reinterpretation, or ownership change is a stop condition and requires explicit approval.

### 4. Execute repair SQL explicitly

For bounded fix-forward SQL:

```sh
pnpm prisma db execute --file /path/to/recovery.sql
```

The recovery SQL must be derived from the intended migration end state and the inspected live state. It must not replay statements that already succeeded.

### 5. Verify before resolving history

Verify that the repaired database has the intended tables/columns/constraints/triggers and that critical invariants reject invalid writes.

Do not mark a migration applied merely because the repair command exited successfully.

### 6. Resolve Prisma migration history

If the database now represents the completed migration:

```sh
pnpm prisma migrate resolve --applied <migration_name>
```

If the failed migration was safely rolled back instead:

```sh
pnpm prisma migrate resolve --rolled-back <migration_name>
```

Use exactly one direction that matches the actual database state.

### 7. Recheck and continue

```sh
pnpm prisma migrate status
pnpm prisma migrate deploy
pnpm prisma generate
```

`migrate deploy` is resumed only after the failed migration no longer appears unresolved.

## Migration History Rule

Once a migration has successfully applied to a shared or production environment, treat that migration file as immutable. Correct later defects with a new migration.

The narrow exception is an actively failed migration that has not successfully completed and is being repaired as part of an explicit recovery incident. Any edit in that situation must still be followed by state inspection and `migrate resolve`; changing the file alone does not repair the target database.

## CI Boundary

`prisma validate` and `prisma generate` validate the Prisma model but do not execute raw migration SQL.

Changes under `prisma/migrations`, Prisma schema files, migration recovery scripts, or `prisma.config.ts` require the dedicated migration smoke gate, which executes the complete migration chain against the same MariaDB major/minor image used by the production Compose runtime.
