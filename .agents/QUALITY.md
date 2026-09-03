# SOPFlow Quality

This file is the canonical owner for repository verification, required checks, CI gate selection, and release-readiness evidence. Product behavior belongs in `PROJECT.md`; architecture boundaries belong in `ARCHITECTURE.md`; active milestone evidence belongs in `CURRENT_ITERATION.md`.

## Quality Principle

Verification optimizes for the **smallest sufficient automated evidence for the changed risk boundary**.

Do not equate more tests with more confidence. Do not run a deeper layer only because it exists. Do not claim a broader delivery state than the evidence proves.

Manual acceptance testing, black-box/browser E2E testing, and human visual review are not required milestone, merge, or release gates. If an environment-specific behavior cannot be reproduced deterministically, record residual risk rather than creating a manual/browser qualification step.

For every logical change, answer:

1. What observable behavior or contract changed?
2. At which boundary can that change fail?
3. What is the cheapest automated evidence that directly observes that failure?
4. What material failure remains invisible after that evidence?
5. Is there another deterministic repository-owned boundary that should be exercised?

Only escalate when #5 is yes.

```text
changed risk
  -> cheapest direct automated evidence
  -> residual-risk check
  -> deeper deterministic boundary evidence only when justified
```

This is not a mandatory test ladder.

## Gate Classes

| Gate | Purpose | Typical evidence | Default use |
| --- | --- | --- | --- |
| G0 — No executable gate | No executable/runtime risk changed | documentation consistency | pure docs, agent knowledge, comments, non-executable metadata |
| G1 — Package integrity | Prove affected package still compiles/builds | install, typecheck, build, generated-file consistency | executable client/server changes |
| G2 — Focused behavior | Prove changed policy/interaction | unit, component, focused domain tests | behavior-bearing code |
| G3 — Runtime boundary | Prove persistence/runtime/container contract | integration, migration smoke, container build | DB, transaction, file/artifact, Docker/Compose boundaries |
| G4 — Broad deterministic qualification | Broaden regression confidence when blast radius is genuinely wide | selected/full deterministic package, domain, integration, migration, container checks | shared infrastructure or explicit release qualification |

A higher gate does not replace a cheaper gate when both prove different risks. Conversely, a higher gate must not be added merely as ceremony.

## Default Gate Selection Matrix

| Changed boundary | Automatic repository gate | Additional evidence only when required |
| --- | --- | --- |
| `.agents/**`, Markdown, non-executable docs | none | factual consistency check when claims depend on code/runtime |
| `client/src/**` and client build inputs | Client CI | focused component/integration tests for changed semantics |
| generic `server/src/**` and server build inputs | Server CI | focused integration when DB/transaction/runtime behavior is not proven by units |
| FTI Process / contextual authority / Process notification / Process TTE code | Server CI + FTI Domain CI | targeted repository-owned integration for affected cross-owner contracts |
| Prisma schema/migration/recovery inputs | Server CI when schema/build input applies + Migration Smoke | targeted persistence/integration for affected product behavior |
| Compose/environment contract | Compose Config | Container Build when production container inputs are affected |
| Dockerfiles / production container runtime files | Container Build | automated deployment smoke only when release/deploy is explicitly in scope |
| cross-boundary user journey | package/domain gates for touched code + focused deterministic integration | broader deterministic regression only if blast radius cannot be bounded |

The matrix is a default. A logical change may require less or more automated evidence if the actual risk boundary differs, but skipped relevant deterministic gates must be explained.

## CI Ownership

### Client CI

Client CI is the automatic G1/G2 baseline for application-facing client inputs.

It verifies:

1. frozen dependency install;
2. production build and route generation;
3. committed generated route-tree consistency;
4. TypeScript typecheck;
5. unit/component tests.

### Server CI

Server CI is the automatic G1/G2 baseline for executable server source, package/build configuration, and Prisma schema inputs needed by application compilation.

It verifies:

1. frozen dependency install;
2. Prisma validation and client generation;
3. TypeScript typecheck;
4. core unit tests.

Do not use Server CI as a proxy for Dockerfile, migration SQL, or deployment correctness.

### FTI Domain CI

FTI Domain CI is a focused G2 gate for the target FTI workflow boundary. It runs only when Process administration/context, organizational authority, Process-bound authoring/review/approval/revocation, Process notifications, Process TTE, or their persisted Prisma contract changes.

It protects the target-domain policies that are intentionally outside the broad legacy/core unit baseline. It must not become a universal server gate.

### Migration Smoke

Migration Smoke is G3 evidence and runs only for migration-relevant inputs.

It must verify the runtime-matched MariaDB path, including:

- recovery-script syntax where applicable;
- Prisma schema validation/client generation;
- full migration chain from an empty database;
- `prisma migrate status` clean state;
- migration-history completeness;
- durable database invariants that the migration chain promises;
- target fixture/seed compatibility when the changed migration/seed boundary requires it.

Schema validation alone is not proof that migration SQL works.

### Compose Config

Compose Config is a cheap G3 configuration gate. It validates production and integration-test Compose resolution plus the canonical external production environment contract. It does not prove that a Dockerfile can build.

### Container Build

Container Build is G3 evidence for production container inputs. It runs only when production Compose build wiring, Dockerfiles, or production container runtime files change.

It builds the backend and frontend images through the production Compose build contract. Do not run application domain suites merely because a Dockerfile or container entrypoint changed.

## Mandatory Evidence by Risk Boundary

### Bounded code behavior

Usually require focused behavior evidence when meaningful plus affected package typecheck/build evidence appropriate to the package. Use targeted lint only when lint is relevant and its baseline is trustworthy.

### User-visible frontend workflow

Use component/unit evidence for local interaction and focused repository-owned integration when router, server contract, authentication, persistence, or multi-step workflow integration materially matters. Do not require a browser journey to establish completion.

### Authorization / Process relationship / organizational authority

Verify both permitted and denied paths. For Process access, include unrelated Process/Process Team denial when relevant.

For final authority resolution:

```text
FACULTY    -> DEAN
DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
```

The same contextual authority boundary applies to Process-bound revocation. `SUPER_ADMIN` is not an implicit workflow bypass.

### Workflow transition / concurrency

When the change affects workflow state or atomicity, verify valid source state, stale/invalid transition behavior, persistence/audit side effects, no orphan side effects after failed/raced transitions, and transaction boundaries when atomicity is part of the product promise.

Unit evidence is insufficient when the invariant depends on actual persistence or transaction behavior.

### TTE / PDF / public verification

Select deterministic evidence for the changed part of the chain: contextual authority, credential/error handling, signing operation, persisted signing evidence, artifact generation/storage, effective-state transition, and QR/public verification.

For a complete cross-owner chain, prefer focused API/domain/persistence integration that directly exercises the owned contracts. Do not force a browser acceptance layer.

### Public archive / discovery

When Process-native public discovery changes, protect applicable invariants such as native `SOP.processId` classification, current `BERLAKU` + official `PUBLISHED` artifact filtering, faculty/department context, Process-scoped lists, legacy/unbound compatibility, official persisted artifact resolution, and revocation behavior.

Use focused repository-owned integration across SQL/HTTP/projection boundaries when the change spans them. Browser E2E is not a required gate.

### Notifications

Protect recipient resolution, event mapping, read/unread behavior, action destination, absence of unintended delivery, Process/legacy isolation, duplicate-recipient collapse, and transaction participation when atomic feedback is promised.

Realtime refresh is post-commit presentation behavior and must not be emitted for a rolled-back transition.

## Integration / Full-Suite Rule

Do not run full integration, coverage, Compose, migration, or deployment checks on every change.

Run broader deterministic integration evidence when persistence/transaction behavior cannot be proven by unit tests, a shared adapter/runtime contract changed, blast radius crosses module/package boundaries in a way focused tests cannot bound, or an observed failure indicates hidden coupling.

Run a broad/full deterministic suite when release qualification explicitly requires it, shared test/auth/seed/database infrastructure changed broadly, a cross-cutting change has genuinely unbounded blast radius, or targeted evidence exposed a regression pattern that warrants expansion.

Broad testing is an escalation response to risk, not a completion ritual.

## Lint / Static Analysis

Keep TypeScript strictness intact. Do not make a noisy pre-existing repository-wide lint baseline a universal blocker. Use targeted lint for changed code and promote broader lint only when the baseline is stable enough to be decision-useful.

## Delivery State Semantics

Use exactly these states:

```text
IMPLEMENTED
  -> VERIFIED
  -> INTEGRATED
  -> RELEASE_READY
  -> RELEASED
  -> DEPLOYED
```

- **IMPLEMENTED** — code/config exists; no verification claim yet.
- **VERIFIED** — mandatory risk-selected automated evidence is green for the exact source revision.
- **INTEGRATED** — the change is merged and relevant integrated-master baseline evidence is green.
- **RELEASE_READY** — integrated behavior satisfies the approved product outcome, mandatory automated risk gates are green, no unresolved stop condition remains, and residual/skipped risk is explicit.
- **RELEASED** — an authorized release action completed.
- **DEPLOYED** — the authorized target environment successfully deployed the released artifact.

A branch-green result is not `INTEGRATED` evidence.

## Milestone Gate

A milestone may become `RELEASE_READY` only when:

- approved milestone behavior is satisfied end-to-end at the product level;
- each Slice has sufficient deterministic evidence for its changed risk boundary;
- mandatory cross-slice/integrated evidence is green;
- relevant master CI is green;
- no unresolved stop condition remains;
- `CURRENT_ITERATION.md` reflects the actual state and exact evidence;
- skipped relevant automated gates and residual risk are explicit.

Milestone completion is about integrated user capability, not number of tests, PRs, or green badges.

## Documentation Verification

When a change modifies durable product truth, architecture, repository conventions, quality gates, material rationale, or active iteration state, update the canonical owner only.

## Completion Reporting

Report only decision-useful evidence:

- changed behavior/boundary;
- exact source revision;
- checks that passed or failed;
- relevant automated gates intentionally skipped and why;
- unresolved risk/blockers;
- integration state;
- next meaningful action when work remains.

Do not upgrade confidence beyond the evidence collected.
