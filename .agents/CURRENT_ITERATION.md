# Current Iteration

Iteration: Sprint 6 — Migration Reliability & Deployment Safety
Delivery State: PLANNED
Branch: not created yet
Created: 2026-09-01

## Why This Iteration Exists

Sprint 5 is merged into `master`, but the first deployment attempt exposed a migration-chain failure before the next product slice could be considered safe to ship.

Observed evidence:

```text
prisma migrate deploy
  -> 20260901163000_add_fti_process_foundation
  -> MySQL error 3823
  -> P3018
  -> subsequent deploy -> P3009 failed-migration block
```

The failing migration combined a `CHECK` using `Process.departmentId` with explicit FK referential actions on that same column. The source migration has been hotfixed to preserve the scope/department invariant through `BEFORE INSERT/UPDATE` triggers while retaining the intended foreign key actions.

The existing default Server CI validates/generates Prisma and runs TypeScript/unit checks, but it does not execute the historical migration chain against a real database. Therefore this class of DDL failure was outside the evidence boundary of normal CI.

This is now a proven delivery bottleneck, not speculative test coverage.

## Feature Shape

Add a narrow migration-specific safety lane without turning normal CI into an integration pipeline.

```text
normal server change
  -> existing fast Server CI

migration/schema-history change
  -> existing fast Server CI
  -> migration smoke lane
       -> disposable MariaDB
       -> apply full migration chain from empty DB
       -> verify critical target invariants
```

Normal backend/client iteration must remain fast.

## Current Position

`UNDERSTAND -> BOUND -> SPECIFY -> DESIGN`

Sprint 6 is planned only. No Sprint 6 implementation branch exists yet.

## Sprint Goal

Make migration failures such as the observed `3823` detectable before deployment and make failed-migration recovery explicit and repeatable, while adding no full integration/E2E burden to ordinary commits.

Success means:

1. the complete committed Prisma migration chain applies successfully to the repository-supported MariaDB test engine from an empty database;
2. migration-changing commits automatically run that proof;
3. ordinary server commits do not pay the database-smoke cost;
4. Process scope/department DB invariants are verified against the resulting database;
5. production failed-migration recovery is documented as an explicit operational procedure, with no reset/destructive default;
6. migration history edits/recovery semantics are documented so future agents do not treat `prisma validate` as proof of raw SQL compatibility.

## Slice A — Full Migration Chain Smoke

Add one dedicated migration verification command/workflow using the existing repository database baseline (`mariadb:11.4`).

Expected flow:

```text
fresh MariaDB
  -> pnpm install --frozen-lockfile
  -> prisma migrate deploy
  -> prisma migrate status
  -> targeted invariant assertions
```

The smoke must execute the **full historical chain**, not only the latest migration, because ordering and accumulated raw SQL are part of the deployment contract.

Do not run application integration suites in this lane.

## Slice B — Path-Scoped CI

Add a separate workflow rather than expanding every Server CI run.

Trigger only when relevant inputs change, initially:

```text
server/prisma/migrations/**
server/prisma/*.prisma
server/prisma.config.ts
migration-smoke workflow/script itself
```

Properties:

- cancel superseded runs;
- strict timeout;
- one MariaDB service only;
- no browser;
- no Docker Compose application stack;
- no full Jest integration suite;
- no coverage;
- no deployment.

If only TypeScript/application code changes, this lane should not run.

## Slice C — Migration Invariant Proof

After the chain applies, verify at minimum:

```text
Process.scope = FACULTY
  -> departmentId must be NULL

Process.scope = DEPARTMENT
  -> departmentId must be non-NULL and reference Department

ProcessMember
  -> Process/User foreign keys exist
```

For the hotfixed Process invariant, prove both INSERT and UPDATE rejection paths so the trigger replacement is evidence-backed rather than assumed.

Keep these checks narrowly tied to raw-SQL invariants that Prisma schema validation cannot prove.

## Slice D — Recovery Contract

Document the production/staging failed-migration recovery contract around:

```text
P3018 / P3009
  -> inspect actual partial state
  -> choose explicit fix-forward or rollback path
  -> prisma migrate resolve only after state matches the chosen path
  -> prisma migrate status
  -> migrate deploy
```

Rules:

- never use `migrate reset` as production recovery;
- never delete/edit `_prisma_migrations` rows manually as the default procedure;
- do not blindly rerun a partially applied migration;
- inspect which DDL statements committed before deciding recovery;
- if a failed migration file must be corrected, source control and database recovery must converge on the same intended migration end-state;
- migrations that have already been successfully applied in shared/production environments are immutable by default; prefer a new corrective migration rather than rewriting successful history.

## Non-Goals

Sprint 6 does **not** include:

- Dean/Kadep final approval;
- TTE migration;
- evaluator cleanup;
- full integration tests on every push;
- browser E2E;
- deployment automation;
- production database mutation from CI;
- resetting any existing environment;
- migration squashing/rebaselining unless separate evidence proves it necessary.

## Verification Plan

Required evidence before closure:

### Fast existing gates

- Prisma validate/generate: PASS;
- server typecheck: PASS;
- existing core/focused unit suites: PASS.

### Migration-specific gate

- clean disposable MariaDB starts;
- all committed migrations apply from empty DB;
- `prisma migrate status` reports migration history synchronized;
- Process scope trigger INSERT negative cases PASS;
- Process scope trigger UPDATE negative cases PASS;
- valid FACULTY/DEPARTMENT cases PASS;
- migration workflow is path-scoped and does not run on unrelated client/server application-only changes.

No full application integration/E2E suite is required unless the migration smoke uncovers a boundary that cannot be proven more narrowly.

## Stop Conditions

Stop and surface instead of inventing a fix if:

- the full migration chain fails in an older unrelated migration;
- recovery would require dropping or rewriting existing production data;
- database engine/version behavior materially differs from the repository test engine;
- successful historical migrations would need rewriting;
- production migration state cannot be reconciled without knowing what DDL partially committed.

## Next Move

Execute Sprint 6 on a dedicated branch from current `master`.

First implementation action:

```text
add reproducible migration-smoke command
  -> prove full chain on MariaDB 11.4
  -> then wire the same command into path-scoped CI
```

After Sprint 6 is verified and the current environment migration history is healthy, continue product work with:

```text
Sprint 7 — Contextual Final Approval
READY FOR APPROVAL
  -> FACULTY -> DEKAN
  -> DEPARTMENT -> relevant KADEP
```

TTE remains after authority resolution; it must execute resolved authority rather than define it.
