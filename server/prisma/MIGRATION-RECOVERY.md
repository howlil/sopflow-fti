# Prisma Migration Operations

## Production owner

Production migration/seed is owned by the one-shot Compose service `bootstrap`, not by backend application startup.

```text
db healthy
  -> bootstrap
       -> inspect/adopt existing baseline when safe
       -> prisma migrate deploy
       -> seed-if-empty
  -> backend
```

A bootstrap failure must stop deployment before backend starts.

## Fresh database

A fresh database starts from the canonical FTI baseline normally. `prepare-existing-baseline` sees no application tables, so bootstrap runs:

```sh
prisma migrate deploy
node dist/src/database/seed/seed-initial.js
```

Migration Smoke additionally validates/generates Prisma and runs the DB invariant audits.

## Existing target database: safe baseline adoption

Production may contain the historical database created before the FTI-native migration set was squashed. Bootstrap handles this automatically, but only when it can prove the database already represents the baseline.

`prepare-existing-baseline` checks:

1. whether application tables already exist;
2. whether `0_fti_native_baseline` is already recorded as successfully applied;
3. if it is not recorded, whether all tables and columns required by the canonical baseline already exist.

Only the verified third case returns the dedicated adoption signal. Bootstrap then runs:

```sh
prisma migrate resolve --applied 0_fti_native_baseline
prisma migrate deploy
```

This does not recreate tables or rewrite application data. Existing historical rows in `_prisma_migrations` remain database-local operational history.

If required baseline tables/columns are missing, automatic adoption stops. Do not bypass that failure by manually marking the baseline applied.

## Failed migration recovery

Use this path when bootstrap reports a real migration failure such as `P3018` or `P3009`.

- Never run `prisma migrate reset` against a shared, staging, or production database.
- Never delete or hand-edit rows in `_prisma_migrations` as a shortcut.
- Inspect the actual database state before deciding on a repair.
- Prefer a bounded fix-forward migration for defects discovered after a migration completed.
- A destructive rollback, ambiguous data reinterpretation, ownership change, or security-boundary change requires explicit approval.

Recovery sequence:

```text
inspect bootstrap error
  -> inspect actual database state
  -> apply bounded fix-forward repair when required
  -> verify schema and invariants
  -> prisma migrate resolve only when the inspected state justifies it
  -> prisma migrate deploy
  -> prisma migrate status
  -> db:audit:fti
```

MySQL/MariaDB DDL is not assumed to roll back as one transaction. Always inspect tables, columns, indexes, foreign keys, triggers, and affected data before resolving migration state.

## CI boundary

- `Migration Smoke` proves the migration chain against fresh MariaDB and validates database invariants.
- `Deployment Smoke` builds the production images and runs the actual Compose chain through `db -> bootstrap -> backend -> frontend` until healthy.
