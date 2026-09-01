# Current Iteration

Iteration: Sprint 6 — Migration Reliability & Deployment Safety
Delivery State: VERIFIED_BRANCH
Operational Recovery: READY_TO_EXECUTE
Branch: `chore/migration-reliability`
Created: 2026-09-01

## Feature Shape

Sprint 6 addresses the deployment incident where `20260901163000_add_fti_process_foundation` failed with MariaDB error `3823`, leaving Prisma blocked by `P3018/P3009`.

Implemented shape:

```text
migration-relevant repository change
  -> fast Server CI
  -> Migration Smoke
       -> mariadb:11.4
       -> --lower_case_table_names=1
       -> full historical migrate deploy
       -> migration-history proof
       -> Process foundation DB invariant proof

already-failed deployment database
  -> incident-specific recovery script
       -> inspect partial state
       -> fail closed on ambiguity
       -> bounded fix-forward
       -> verify end-state
       -> migrate resolve --applied
       -> remaining migrate deploy
       -> final migrate status
```

No product behavior, approval behavior, TTE behavior, deployment automation, reset, or destructive rollback was introduced.

## Current Position

`QUALITY GATES -> STOP`

Repository implementation is verified. The affected deployment database itself is **not yet certified recovered** because no shell/database connector is available in this conversation to execute the recovery against that environment.

## Completed Delta

### Migration Smoke

`.github/workflows/migration-smoke.yml` is path-scoped to:

- `server/prisma/migrations/**`;
- `server/prisma/recovery/**`;
- `server/prisma/*.prisma`;
- `server/prisma.config.ts`;
- the migration-smoke workflow itself.

It verifies:

1. recovery shell scripts parse with `bash -n`;
2. Prisma schema validation;
3. all committed migrations apply from an empty runtime-matched MariaDB;
4. `prisma migrate status` is synchronized;
5. migration-history completeness and zero unresolved failed migrations;
6. all four Process/ProcessMember foreign keys;
7. Process scope INSERT/UPDATE triggers;
8. valid FACULTY/DEPARTMENT writes;
9. invalid Process scope INSERT/UPDATE rejection.

### Failed Migration Recovery

Added:

`server/prisma/recovery/20260901163000_add_fti_process_foundation.sh`

Modes:

```text
--inspect  read-only live-state inspection
--apply    bounded fix-forward + verified migrate resolve/deploy
```

The script requires exactly one unresolved failed row for `20260901163000_add_fti_process_foundation`, validates existing partial objects before mutation, refuses ambiguous `Department`/`Process`/`ProcessMember` state, verifies the backend image contains the fixed trigger-based migration, creates only missing intended objects, reinstalls the Process scope triggers, proves the repaired invariant, resolves the failed migration only after verification, applies remaining migrations, then verifies final status.

The script never runs `migrate reset`, deletes `_prisma_migrations` rows, drops domain tables, restarts services, or deploys application images.

Operational procedure is documented in `server/prisma/MIGRATION-RECOVERY.md`.

## Verification Evidence

Final recovery-tooling commit:

`8c13b6f16a6803f35d3b2a8fb61c8eeacea0f46e`

Migration Smoke run `33521190650`: **PASS**.

Evidence includes recovery-script syntax validation, runtime-matched MariaDB startup, full migration chain, migration history, and Process foundation database invariants.

Server CI run `33521190638`: **PASS**.

The earlier exploratory Prisma-schema-versus-migration drift remains separate historical debt and is not treated as resolved by this sprint.

## Operational Execution

On the deployment host, from repository code containing the fixed migration and recovery script:

```sh
bash server/prisma/recovery/20260901163000_add_fti_process_foundation.sh --inspect
```

Only if inspection passes:

```sh
bash server/prisma/recovery/20260901163000_add_fti_process_foundation.sh --apply
```

If the backend image still contains the old CHECK-based migration, the script stops before database mutation; rebuild/update that image first.

## Stop Conditions

Stop instead of automatic repair if:

- the unresolved failed migration is not exactly `20260901163000_add_fti_process_foundation`;
- existing Process-foundation tables have an unexpected or partial shape;
- existing Process rows violate scope/department semantics;
- expected foreign keys are partially present in an ambiguous shape;
- the backend image still contains the old failing migration;
- repair would require destructive rollback or data reinterpretation.

## Next Move

Execute the recovery script on the affected environment and retain its output as deployment evidence.

After environment recovery and explicit merge authorization, continue with Sprint 7 — Contextual Final Approval:

```text
READY FOR APPROVAL
  -> FACULTY -> DEKAN
  -> DEPARTMENT -> relevant KADEP
```

TTE remains after contextual authority resolution.

Do not merge, deploy, or release Sprint 6 without explicit user authorization.
