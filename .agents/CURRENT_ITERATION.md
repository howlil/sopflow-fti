# Current Iteration

Iteration: Sprint 6 — Migration Reliability & Deployment Safety
Delivery State: VERIFIED_BRANCH
Branch: `chore/migration-reliability`
Created: 2026-09-01

## Feature Shape

Sprint 6 adds a narrow database-migration safety lane after the deployment incident where `20260901163000_add_fti_process_foundation` failed with database error `3823`, then left Prisma blocked by `P3018/P3009`.

Implemented shape:

```text
normal application change
  -> existing fast Server / Client CI

migration-relevant change
  -> existing fast CI as applicable
  -> dedicated Migration Smoke
       -> runtime-matched MariaDB 11.4
       -> --lower_case_table_names=1
       -> full historical prisma migrate deploy
       -> migrate status + migration-history proof
       -> critical raw-SQL invariant proof
```

This sprint does not add product behavior, approval behavior, TTE changes, deployment automation, or full integration/E2E to ordinary commits.

## Current Position

`QUALITY GATES -> STOP`

Sprint 6 is implemented and verified on its branch. It is not merged, deployed, or released.

## Completed Delta

### Dedicated Migration Smoke

Added `.github/workflows/migration-smoke.yml`.

The workflow is path-scoped to:

- `server/prisma/migrations/**`;
- `server/prisma/*.prisma`;
- `server/prisma.config.ts`;
- `.github/workflows/migration-smoke.yml`.

It uses the same database baseline as production Compose: `mariadb:11.4` with `--lower_case_table_names=1`.

The gate performs:

1. frozen dependency install;
2. Prisma schema validation;
3. full `prisma migrate deploy` from an empty database;
4. `prisma migrate status`;
5. migration-directory count versus successful `_prisma_migrations` history count;
6. unresolved failed-migration count = zero;
7. Process/ProcessMember foreign-key presence proof;
8. Process scope trigger presence proof;
9. valid FACULTY/DEPARTMENT structural writes;
10. invalid FACULTY/DEPARTMENT INSERT rejection;
11. invalid Process scope UPDATE rejection.

The workflow does not run the application integration suite, browser E2E, application Compose stack, coverage, deployment, or release steps.

### Failed Migration Recovery Contract

Added `server/prisma/MIGRATION-RECOVERY.md`.

Canonical recovery loop for shared/staging/production databases:

```text
inspect failed migration
  -> inspect actual partial database state
  -> explicit fix-forward or safe rollback
  -> execute bounded repair SQL
  -> verify resulting schema/invariants
  -> prisma migrate resolve
  -> prisma migrate status
  -> prisma migrate deploy
```

Rules include:

- no `migrate reset` for shared/staging/production recovery;
- no manual `_prisma_migrations` row editing as a shortcut;
- no blind rerun of a partially applied migration;
- treat successfully applied shared/production migration files as immutable by default;
- an actively failed migration is the narrow recovery exception and still requires state inspection + `migrate resolve`.

### Repository Documentation

- `.agents/DEVELOPMENT.md` now distinguishes fast default CI from the migration-specific database gate.
- `server/prisma/DB-INVARIANTS.md` now records Process scope enforcement through `trg_process_scope_department_insert` / `trg_process_scope_department_update` rather than the invalid CHECK formulation.
- Migration-backed verification documentation now explicitly states that `prisma validate`, `generate`, and `db push` are not evidence that historical raw SQL executes successfully.

## Verification Evidence

### Migration Smoke

Final Migration Smoke run `33520082595`: PASS on commit `bae3f958e023430aa1aa82a3e3e65bf0e72c6054`.

Evidence:

- runtime-matched MariaDB startup: PASS;
- Prisma schema validation: PASS;
- all 65 committed migrations applied from an empty database: PASS;
- `prisma migrate status`: PASS / database up to date;
- migration-history completeness: PASS;
- unresolved failed migrations: zero;
- all four Process foundation foreign keys present: PASS;
- Process scope INSERT/UPDATE triggers present: PASS;
- valid scope/context writes: PASS;
- invalid FACULTY/DEPARTMENT INSERTs rejected: PASS;
- invalid Process scope UPDATE rejected: PASS.

This proves the repository migration chain containing the `20260901163000_add_fti_process_foundation` trigger hotfix executes successfully on the current repository-supported production database engine baseline.

### Fast Server CI

Server CI run `33519958047`: PASS on commit `f914c71dc1bc2d4030f00c50570b48552b893a7b`.

Evidence includes:

- Prisma validate: PASS;
- Prisma generate: PASS;
- TypeScript typecheck: PASS;
- core unit tests: PASS;
- focused FTI target-domain unit tests: PASS.

### Path Scope Proof

The migration workflow ran for migration-workflow changes. A later `server/prisma/DB-INVARIANTS.md` documentation-only change triggered Server CI but did not trigger Migration Smoke, demonstrating that ordinary server changes outside the migration input paths do not pay the database-smoke cost.

## Drift Diagnostic

An exploratory `prisma migrate diff --from-config-datasource --to-schema=prisma` after a successful full-chain run exposed broad pre-existing Prisma-model-versus-migration drift, including legacy Pelaksana shape and historical FK/type differences.

That diagnostic was intentionally **not** promoted to a required Sprint 6 gate because:

- the full committed migration chain itself applied successfully;
- the drift is broader historical debt, not the escaped `3823` failure boundary;
- making the known noisy baseline mandatory would block valid migration work for unrelated existing differences.

Do not interpret this as the drift being resolved. Track schema/migration drift cleanup as a separate bounded iteration if prioritized.

## Residual Operational State

Sprint 6 proves fresh-chain repository correctness. It does **not** mutate or certify the user's already-partially-applied deployment database.

A database currently blocked by `P3018/P3009` must still be reconciled using `server/prisma/MIGRATION-RECOVERY.md` based on its actual partial state before deployment can continue.

No production database reset, deployment, or automatic `migrate resolve` is performed by CI.

## Next Move

After the affected environment's failed migration is explicitly recovered and the branch is merged when authorized, continue product work with:

```text
Sprint 7 — Contextual Final Approval

READY FOR APPROVAL
  -> FACULTY -> DEKAN
  -> DEPARTMENT -> relevant KADEP
```

Sprint 7 should establish the contextual final-approval resolver and authorization before TTE is cut over. TTE must execute the resolved organizational authority rather than define it.

Do not merge, deploy, or release Sprint 6 without explicit user authorization.
