# SOPFlow Quality

This file owns repository verification, CI gate selection, and release-readiness evidence. Product behavior belongs in `PROJECT.md`; architecture boundaries belong in `ARCHITECTURE.md`; current delivery state belongs in `CURRENT_ITERATION.md`.

## Principle

Use the **smallest automated evidence that directly proves the changed risk**. More tests are not automatically more confidence.

For each logical change:

1. identify the observable behavior or contract that changed;
2. identify the boundary where it can fail;
3. run the cheapest deterministic repository-owned check that observes that failure;
4. escalate only when a material risk is still invisible.

Browser E2E, manual acceptance, and visual review are not default merge or release gates.

## Gate classes

| Gate | Purpose | Typical evidence |
| --- | --- | --- |
| G0 | No executable risk changed | documentation consistency |
| G1 | Package remains buildable | production build, route generation, typecheck |
| G2 | Behavior remains correct | unit/component tests |
| G3 | Runtime boundary remains valid | MariaDB migration smoke, production Compose deployment smoke |
| G4 | Broad qualification for genuinely wide risk | Full FTI Exit, selected use-case E2E |

## Current CI model

### Client CI

Automatic for client source/build inputs.

It runs:

1. frozen dependency install;
2. production build and route generation;
3. generated route-tree consistency;
4. TypeScript typecheck;
5. Vitest unit/component tests.

### Server CI

Automatic for server source/build inputs and Prisma inputs required by compilation.

It runs:

1. frozen dependency install;
2. Prisma validate and generate;
3. production Nest build;
4. TypeScript typecheck;
5. Jest unit tests.

FTI workflow/domain tests live in the normal server Jest suite. There is no separate domain CI workflow.

### Migration Smoke

Automatic only when Prisma schema/migrations change, and available manually for explicit qualification. It uses runtime-matched MariaDB and proves the committed migration chain from a fresh database, seed compatibility, and database invariants.

### Deployment Smoke

This is the owner of the production container/Compose boundary. It replaces separate Compose-validation and image-build workflows.

On `master`, it runs for application/runtime/deployment inputs. On pull requests it runs when deployment-critical files change. It:

1. validates the resolved production Compose and canonical environment contract;
2. builds the production backend and frontend images;
3. starts the same `db -> bootstrap -> backend -> frontend` dependency chain used in deployment;
4. waits for actual service health;
5. verifies frontend-owned `/healthz` and the proxied backend readiness endpoint;
6. dumps bootstrap/backend/frontend logs on failure.

A green image build alone is not runtime evidence.

## Deployment ownership

Production startup has one owner per stage:

```text
db
  -> bootstrap (baseline adoption + migrate + seed-if-empty; one-shot)
  -> backend (application only)
  -> frontend (nginx + SSR)
```

Health ownership is equally narrow:

- MariaDB health belongs to `db`;
- migration/seed success is the bootstrap process exit code;
- backend `/api/health/ready` owns database connectivity plus writable SOP storage;
- frontend `/healthz` owns nginx + SSR only.

Do not proxy backend/database readiness through the frontend healthcheck. Do not put migrations or seed back into backend application startup.

## Manual qualification workflows

### Full FTI Exit

Use only for explicit FTI release/cutover qualification or when a cross-cutting change could reintroduce retired organization/role semantics. It is not a normal per-change gate.

### Browser E2E

Browser E2E is manual and use-case driven. `client/e2e/use-cases.json` owns the business-use-case mapping. Run `pnpm test:e2e:usecase -- UCxx` only when a real cross-boundary risk needs browser-level evidence or when diagnosing a regression.

Do not restore permanent J-number or cumulative historical milestone gates.

## Default gate selection

| Changed boundary | Default evidence | Escalate only when needed |
| --- | --- | --- |
| `.agents/**`, Markdown, non-executable metadata | G0 factual consistency | none |
| `client/src/**` and client build inputs | Client CI | Deployment Smoke on master; selected UC E2E only for real browser-boundary risk |
| `server/src/**` and server build inputs | Server CI | Deployment Smoke on master; focused persistence integration when unit evidence cannot prove the invariant |
| Prisma schema | Server CI + Migration Smoke | Full FTI Exit only for broad cutover qualification |
| migration SQL / DB triggers / DB invariant scripts | Migration Smoke | Full FTI Exit only for broad cutover qualification |
| Compose/environment/Docker/runtime files | Deployment Smoke | target-environment deploy only after repository smoke is green |
| wide FTI cutover / release qualification | affected automatic gates | Full FTI Exit and selected UC E2E only for remaining material risk |

## Important risk boundaries

### Authorization and organizational context

Verify both allowed and denied paths when authorization changes.

```text
FACULTY    -> DEAN
DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
```

`SUPER_ADMIN` is platform administration only and must not become a ProsesBisnis Owner, ProsesBisnis Member, or contextual workflow authority.

### Workflow transition / concurrency

When workflow state or atomicity changes, verify:

- valid source state;
- stale/invalid transition rejection;
- persistence/audit side effects;
- no orphan side effects after failure/race;
- transaction behavior when atomicity is part of the product contract.

Use real persistence evidence when the invariant depends on database behavior.

### TTE / PDF / public verification

Select evidence for the changed part of the chain: contextual authority, credential/error handling, signing, persisted signing evidence, artifact storage, `EFFECTIVE` transition, and public/QR verification.

### Public archive / discovery

Protect current FTI semantics: direct `SOP.prosesBisnisId` ownership, current `EFFECTIVE` SOPs, official published artifacts, Faculty/Departemen context, ProsesBisnis-scoped discovery, and revoked/version-replaced behavior.

### Notifications

Protect recipient resolution, event mapping, read/unread state, action destination, duplicate-recipient collapse, and transaction participation when atomic feedback is promised. Realtime refresh must not be emitted for a rolled-back transition.

## Broad-suite rule

Do not run full integration, migration, browser, or release qualification on every change.

Escalate when:

- persistence/transaction behavior cannot be proven by units;
- a shared runtime adapter/contract changed broadly;
- blast radius cannot be bounded with focused evidence;
- targeted evidence exposes hidden coupling;
- release/cutover qualification is explicitly required.

Deployment Smoke is intentionally the one production-runtime proof instead of several overlapping Compose/container workflows.

## Delivery states

```text
IMPLEMENTED
  -> VERIFIED
  -> INTEGRATED
  -> RELEASE_READY
  -> RELEASED
  -> DEPLOYED
```

- **IMPLEMENTED** — code/config exists.
- **VERIFIED** — required risk-selected evidence is green for the exact source revision.
- **INTEGRATED** — merged and relevant master evidence is green.
- **RELEASE_READY** — integrated product outcome is complete, required automated evidence is green, and material residual risk is explicit.
- **RELEASED** — an authorized release action completed.
- **DEPLOYED** — the released artifact is running successfully in the target environment.

## Release-ready rule

A product milestone can be `RELEASE_READY` when:

- the approved user capability is complete;
- relevant automatic CI is green;
- required runtime qualification for changed DB/container boundaries is green;
- no unresolved material blocker remains;
- `CURRENT_ITERATION.md` records the actual evidence and residual risk.

Completion is about integrated user capability, not test count, PR count, or number of green badges.
