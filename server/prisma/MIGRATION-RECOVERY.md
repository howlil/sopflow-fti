# Prisma Migration Operations

## Fresh database

A fresh database starts from the canonical FTI baseline and installs the native database invariants normally:

```sh
pnpm prisma migrate deploy
pnpm prisma generate
pnpm db:audit:fti
```

Expected committed migrations:

```text
0_fti_native_baseline
1_fti_native_invariants
```

## Existing target database: one-time baseline cutover

Use this path only for a database that already matches the current FTI target schema.

1. Take a verified database backup.
2. Run the target-schema audit using the pre-cutover application version.
3. Mark the canonical baseline as applied without executing its CREATE statements:

```sh
pnpm prisma migrate resolve --applied 0_fti_native_baseline
```

4. Verify Prisma sees the new baseline correctly:

```sh
pnpm prisma migrate status
```

5. Deploy the native invariant migration and re-audit:

```sh
pnpm prisma migrate deploy
pnpm prisma generate
pnpm db:audit:fti
```

Do not execute `0_fti_native_baseline` against a populated target database. `migrate resolve --applied` records that the existing schema already represents that baseline; it does not recreate tables or rewrite application data.

## Failed migration recovery

Use this section when `prisma migrate deploy` reports an unresolved migration failure such as `P3018` or `P3009`.

- Never run `prisma migrate reset` against a shared, staging, or production database.
- Never delete or hand-edit rows in `_prisma_migrations` as a shortcut.
- Inspect the actual database state before deciding on a repair.
- Prefer a bounded fix-forward migration for defects discovered after a migration completed.
- A destructive rollback, ambiguous data reinterpretation, ownership change, or security-boundary change requires explicit approval.

Recovery sequence:

```text
inspect failure
  -> inspect actual database state
  -> apply bounded fix-forward repair when required
  -> verify schema and invariants
  -> prisma migrate resolve when appropriate
  -> prisma migrate status
  -> prisma migrate deploy
  -> prisma generate
  -> db:audit:fti
```

MySQL/MariaDB DDL is not assumed to roll back as one transaction. Always inspect tables, columns, indexes, foreign keys, triggers, and affected data before resolving migration state.

## CI boundary

Migration changes require the migration smoke gate. The gate creates a fresh MariaDB database, deploys the committed FTI migration set, seeds the native graph, and verifies canonical schema plus database invariants.
