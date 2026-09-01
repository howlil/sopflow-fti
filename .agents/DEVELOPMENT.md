# SOPFlow Development Guide For Agents

Use this file for setup, commands, and execution/verification details. Product/domain truth belongs in `PROJECT.md`; agent operating rules belong in `AGENTS.md`; live iteration state belongs in `CURRENT_ITERATION.md`.

## Setup

Install dependencies separately in each package:

```sh
cd client
pnpm install
```

```sh
cd server
pnpm install
```

Use Docker Compose from the repository root when validating the full stack:

```sh
docker compose --env-file .env config
docker compose --env-file .env up -d
```

Do not start the full stack merely because it exists. Use the narrowest environment that produces evidence for the changed risk boundary.

## Local Commands

Frontend:

```sh
cd client
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e:critical
```

Backend:

```sh
cd server
pnpm typecheck
pnpm lint
pnpm test
pnpm test:core-unit
pnpm test:integration:docker
```

Database and Prisma:

```sh
cd server
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
```

Do not run `pnpm db:fresh` unless the user explicitly accepts a local database reset.

## Verification Strategy

Match verification depth to change risk. Prefer focused evidence first, then broaden only when justified.

Typical progression:

1. focused unit/domain test or direct evidence
2. affected package typecheck
3. targeted lint
4. integration/database verification when persistence or boundaries changed
5. relevant browser journey for user-visible workflow changes
6. build/Compose/runtime checks when deployment/runtime behavior is affected

Do not run every available gate by default if the change is bounded and narrower evidence is sufficient. Do not skip a broader gate when the affected boundary specifically requires it.

## Lean CI Baseline

CI is a fast feedback gate, not a second release pipeline.

Default push/PR CI is package-scoped and path-triggered so unrelated packages do not run. Stale runs should be cancelled when a newer commit supersedes them.

Server default CI may run only deterministic checks that need no external service:

1. dependency install from lockfile
2. Prisma schema validation and client generation
3. TypeScript typecheck
4. core unit tests
5. focused target-domain unit tests not yet included in the core unit script

Client default CI may run:

1. dependency install from lockfile
2. production build / generated route refresh
3. generated route-tree consistency check when the generated file is tracked
4. TypeScript typecheck
5. unit/component tests

Do **not** add the following to every push/PR by default:

- Docker or Compose startup
- MariaDB-backed integration tests
- Playwright/browser E2E
- full end-to-end business journeys
- coverage collection
- deployment, release, or production smoke tests
- expensive duplicated build/test matrices

Escalate to integration, E2E, Docker/runtime, migration rehearsal, or release checks only when the changed risk boundary actually requires that evidence, when a repeated escaped defect demonstrates a gap, or when a release-specific workflow is explicitly being verified.

Do not make a known noisy/pre-existing repository-wide lint baseline a required CI gate. Prefer targeted lint during implementation; promote broader lint to required CI only after the baseline is clean or a stable changed-files lint strategy exists.

Keep default CI small enough that developers treat it as immediate feedback rather than a queue. If a deterministic default gate becomes materially slow, first remove duplication, scope by package/path, cancel superseded runs, or split independent jobs in parallel before dropping useful correctness evidence.

## Testing Guidance

- Backend Jest root is `server/src`; many focused tests are colocated with modules.
- Backend integration tests intentionally require Docker via `pnpm test:integration:docker`.
- Frontend Vitest tests live under `client/src/**/__tests__` and adjacent `*.test.*` files.
- Playwright business journeys live under `client/e2e`.
- Test observable behavior, authorization, contracts, persistence invariants, and workflow transitions rather than incidental implementation structure.
- For UI behavior changes, run the narrowest relevant component/unit evidence and the relevant Playwright journey when the browser boundary materially matters.
- For authentication or contextual authorization changes, verify both permitted and denied paths.
- For Process Team membership changes, verify unrelated Process Team members do not inherit access.
- For Faculty/Department scope changes, verify the final approver resolves to Dean for `FACULTY` and the relevant Head of Department for `DEPARTMENT`.
- For the FTI domain refactor, treat legacy `OPD`, `KEPALA_OPD`, `EVALUATOR`, and `PJ_EVALUATOR` behavior as migration risk. Verify that retained legacy fields/paths do not accidentally preserve the wrong authorization semantics.
- For TTE/PDF changes, verify authority resolution, signing, persisted evidence, artifact output, and verification path at the appropriate level.
- For notification changes, verify recipient selection and absence of unintended delivery paths.

## Code Style

- Keep TypeScript strictness intact.
- Prefer explicit DTOs and domain mappers over anonymous ad hoc response shapes.
- Keep validation at DTO/schema/boundary layers.
- Keep repository methods responsible for Prisma persistence details and services responsible for business policy.
- Keep React pages thin enough that reusable behavior stays in components, hooks, `lib`, or API modules.
- Use existing status/config/routing helpers before adding duplicated label maps.
- Prefer domain names from `PROJECT.md` for new code. Legacy names may remain temporarily where compatibility requires them, but do not spread legacy terminology into new target-domain APIs or abstractions without justification.

## FTI Domain Refactor Notes

The target model is process-oriented rather than OPD-oriented. Before changing persistence or authorization, re-read the canonical model in `PROJECT.md`.

Critical target invariants include:

```text
Every SOP -> one Process
Every Process -> exactly one Process Owner + one or more Members
Process review -> Process Owner
FACULTY scope -> DEKAN final approval
DEPARTMENT scope -> relevant KEPALA_DEPARTEMEN final approval
```

There is no required centralized evaluator organization in the target model.

Do not infer a physical schema design from these invariants without inspecting the current schema and migration constraints. Prefer a staged, reversible migration over a broad mechanical rename.

## Prisma And Migrations

- Edit `server/prisma/schema.prisma` for model changes.
- Add migrations deliberately and inspect generated SQL before trusting it.
- Keep `server/prisma/DB-INVARIANTS.md` aligned when a database invariant changes.
- Regenerate Prisma client after schema changes.
- Avoid editing generated Prisma output directly.
- Prefer additive/reversible migration steps when practical during the OPD-to-FTI domain transition.
- Do not silently drop or reinterpret existing data to fit the new model.
- A destructive migration, ownership reinterpretation with ambiguous mapping, or public-contract break is a stop condition under `AGENTS.md`.

## Runtime Verification Notes

Unit/type/lint success is local code evidence. It is not proof that:

- Docker images build.
- Compose services start.
- MariaDB migrations apply cleanly against realistic existing data.
- public ingress is wired correctly.
- browser journeys work.
- contextual Process Team authorization works end to end.
- Dean/Kadep approval resolution works through TTE end to end.
- PDF/TTE artifacts render and verify end to end.
- production deployment succeeded.

Report exactly which evidence was collected and do not upgrade confidence beyond that evidence.