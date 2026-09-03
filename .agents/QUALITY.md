# SOPFlow Quality

This file is the canonical owner for repository verification, required checks, and release-readiness evidence. Product behavior belongs in `PROJECT.md`; architecture boundaries belong in `ARCHITECTURE.md`; active evidence belongs in `CURRENT_ITERATION.md`.

## Quality Principle

Verify the changed risk boundary with the smallest sufficient evidence, then broaden only when the affected boundary requires it.

Do not confuse a large test matrix with confidence. Do not claim a broader state than the evidence proves.

Canonical selection questions:

1. What observable behavior changed?
2. At which boundary can that behavior fail?
3. What is the cheapest test or check that observes that boundary?
4. What meaningful failure could remain invisible after that evidence?
5. Is that remaining risk material enough to justify a deeper verification layer?

Only add the next verification layer when the answer to #5 is yes.

Typical escalation when needed:

```text
focused/static evidence
-> unit/component/domain evidence
-> boundary integration/runtime evidence
-> browser E2E for cross-boundary behavior
-> milestone/release evidence
```

This is an escalation model, not a mandatory ladder.

## Baseline Commands

Frontend:

```sh
cd client
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e:critical -- <explicit journey selection>
```

Backend:

```sh
cd server
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:core-unit
pnpm test:integration:docker
```

Prisma/database:

```sh
cd server
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
```

`pnpm db:fresh` is destructive and must not be used without explicit user authorization for the reset.

Use only the commands relevant to the changed boundary; these lists are capabilities, not a requirement to run everything for every change.

## Mandatory Evidence By Boundary

### Bounded code-only change

Usually require:

- focused test/evidence for changed behavior when meaningful;
- affected package typecheck;
- targeted lint when the changed files are in lint scope.

### User-visible frontend workflow

Require evidence proportional to the interaction:

- relevant component/unit coverage;
- production build when route/bundling/SSR behavior can be affected;
- generated route-tree consistency for route changes;
- relevant browser journey when browser integration materially matters.

### Authorization / Process relationship / organizational authority

Verify both permitted and denied paths.

For Process access, include an unrelated Process/Process Team denial case when relevant.

For final authority resolution, verify:

```text
FACULTY    -> DEAN
DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
```

The same contextual authority boundary applies to Process-bound revocation: the resolved final organizational authority may revoke an effective SOP inside that Process scope; unrelated authority holders and `SUPER_ADMIN` without that authority must be denied.

Do not treat `SUPER_ADMIN` as implicit workflow authorization.

### Workflow transition / concurrency

Verify:

- valid source state;
- invalid/stale transition behavior;
- audit/persistence effects;
- absence of orphan side effects on failed or raced transitions;
- transaction boundary when the invariant depends on atomicity.

### Prisma / migration

Schema validation/client generation are not sufficient proof for migration SQL.

When migration-relevant inputs change, Migration Smoke must verify the runtime-matched database path, including:

- Prisma schema validation;
- full migration chain from an empty MariaDB database;
- `prisma migrate status` clean state;
- migration-history completeness;
- affected raw-SQL/database invariants.

Follow `server/prisma/MIGRATION-RECOVERY.md` for failed shared migration recovery. Do not replace explicit recovery with `migrate reset`.

### TTE / PDF / public verification

Use evidence appropriate to each changed boundary:

- contextual authority resolution;
- credential requirement/error handling;
- signing operation;
- persisted signing evidence;
- artifact generation;
- effective-state transition;
- QR/public verification path.

Unit tests alone do not prove the complete TTE/PDF journey.

### Public archive / discovery

For Process-native public discovery, verify:

- Process classification comes from `ProcessSopBinding`, not inferred OPD ownership;
- only current `BERLAKU` versions with official `PUBLISHED` PDF artifacts are returned;
- faculty/department Process context is returned correctly;
- Process selection scopes the SOP list to that Process;
- global target search can resolve Process/Department context without duplicating a Process-bound SOP through legacy fallback;
- legacy/unbound published SOP compatibility remains available where promised;
- the public document action resolves the existing official PDF artifact rather than a parallel generated representation;
- revocation removes current target discovery and official public PDF availability without deleting historical evidence;
- legacy public APIs remain operable when the milestone promises additive compatibility.

Because these invariants span SQL classification, HTTP contracts, route state, browser discovery, artifact serving, and revocation, service/unit evidence alone is insufficient for a public archive cutover.

### Notifications

Verify:

- recipient resolution;
- event-to-recipient mapping;
- read/unread behavior when changed;
- action destination when changed;
- absence of unintended delivery;
- persistence/history isolation when Process and legacy sources are involved.

For workflow-outcome feedback, also verify that notification persistence participates in the owning business transaction when the product promises atomic feedback. Realtime refresh is post-commit presentation behavior and must not be emitted for a rolled-back transition.

When an event targets both the original Process-bound author and Process Owner, verify duplicate-recipient collapse when those identities are the same account.

## Browser / Critical E2E Selection

Critical E2E is **risk-selected**, not cumulative-by-ID.

For a logical change or milestone:

- run every new or materially changed journey that directly proves the capability being delivered;
- add older regression journeys only when the changed files/behavior can plausibly affect the boundary they protect;
- prefer the smallest coherent regression set that still detects material cross-boundary breakage;
- do not automatically run `J01..JNN` merely because `JNN` is the newest journey;
- do not make every browser journey a permanent gate for unrelated changes.

Run the full historical target journey set only when justified, such as:

- milestone/release qualification where broad regression confidence is explicitly desired;
- shared E2E harness, fixture, authentication, seed, database lifecycle, browser-runtime, or workflow-infrastructure changes that can affect many journeys;
- broad cross-cutting authorization/workflow changes whose blast radius cannot be bounded more cheaply;
- investigation of an observed regression that suggests wider coupling.

The local isolated critical runner must receive an explicit journey selection. `--all` is an intentional full-suite operation, not the default.

For M7 account/bootstrap work, the default regression boundary is J20-J23 plus the new J24-J27 journeys. Earlier journeys are added only if a specific affected boundary justifies them.

For M8 contextual revocation, the default regression boundary is J28-J30. Add J17-J19 only if effective-version/replacement semantics are materially changed; do not run them merely because revocation touches an effective status.

For M9 workflow feedback closure, the default browser boundary is J31-J34. These journeys directly exercise revision feedback, effective-state feedback, revocation feedback, and notification action/read integrity. Older approval/TTE/revocation journeys are added only if a failure indicates broader behavioral coupling. Because M9 extends the persisted `ProcessNotificationKind` enum, Migration Smoke is mandatory even though the schema change is additive.

For M10 FTI-native public discovery/archive cutover, the default browser boundary is J35-J38. Run these as one coherent browser suite so one effective Process SOP precondition can prove target catalog classification, Process-first discovery, official PDF continuity, duplicate prevention, and revocation disappearance without repeating the expensive TTE setup four times. The isolated critical runner may still run one J35-J38 journey alone and must create any required precondition itself. Migration Smoke is not an M10 gate because M10 changes no Prisma schema or migration input.

## CI Baseline

Default CI should remain lean and deterministic.

### Client CI

Expected baseline:

1. lockfile install;
2. production/SSR build and route generation;
3. tracked generated route-tree consistency;
4. TypeScript typecheck;
5. unit/component tests.

### Server CI

Expected baseline:

1. lockfile install;
2. Prisma validation and generation;
3. TypeScript typecheck;
4. core unit tests;
5. focused target-domain unit tests not already represented by the core suite.

### Migration Smoke

Run only for migration-relevant inputs and keep it focused on migration correctness/database invariants rather than turning it into the full application integration suite.

Do not add Docker/Compose, full integration, browser E2E, coverage, deployment, or duplicated matrices to every push by default without demonstrated need.

A CI result is evidence only for the exact revision that ran.

## Testing Standard

Tests should protect observable behavior, contracts, authorization, persistence invariants, workflow state, and meaningful failure behavior.

Prefer:

- service/domain tests for policy;
- repository/integration tests for database and transaction behavior;
- controller tests for material transport/guard/contract behavior;
- frontend component tests for user-observable interaction;
- Playwright for critical cross-boundary journeys.

Avoid tests that freeze incidental private implementation structure or exist only to increase test count.

## Lint / Static Analysis

Keep TypeScript strictness intact.

Do not make a known noisy pre-existing repository-wide lint baseline a universal blocking gate. Use targeted lint for changed code and promote broader lint only when the baseline is stable enough to be meaningful.

## Documentation Verification

When a change modifies durable product truth, architecture, repository conventions, quality gates, material rationale, or active iteration state, update the canonical owner only.

Do not maintain duplicate history dumps, sprint summaries, or parallel planning documents.

Documentation claims must be checked against current code, scripts, CI, migrations, and observed evidence where applicable.

## Milestone Gate

A milestone is release-ready only when:

- approved behavior/acceptance conditions are satisfied;
- mandatory risk-specific evidence is green;
- relevant integrated CI is green;
- no unresolved stop condition remains;
- active-state documentation accurately reflects repository reality;
- known skipped evidence or residual risk is explicitly reported.

`release-ready` does not mean `released` or `deployed`.

## Release / Deployment State

Keep states distinct:

```text
implemented
!= verified
!= integrated
!= release-ready
!= released
!= deployed
```

Release and production deployment require explicit user authority and evidence from the corresponding action/environment.

## Completion Reporting

Report only decision-useful evidence:

- behavior/slice changed;
- exact checks that passed or failed;
- skipped relevant gates and why;
- unresolved risks/blockers;
- integration state;
- next meaningful action when work remains.

Do not upgrade confidence beyond the collected evidence.
