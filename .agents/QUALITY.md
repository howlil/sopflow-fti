# SOPFlow Quality

This file is the canonical owner for repository verification, required checks, CI gate selection, and release-readiness evidence. Product behavior belongs in `PROJECT.md`; architecture boundaries belong in `ARCHITECTURE.md`; active milestone evidence belongs in `CURRENT_ITERATION.md`.

## Quality Principle

Verification optimizes for the **smallest sufficient evidence for the changed risk boundary**.

Do not equate more tests with more confidence. Do not run a deeper layer only because it exists. Do not claim a broader delivery state than the evidence proves.

For every logical change, answer:

1. What observable behavior or contract changed?
2. At which boundary can that change fail?
3. What is the cheapest evidence that directly observes that failure?
4. What material failure remains invisible after that evidence?
5. Does that residual risk justify a deeper verification layer?

Only escalate when #5 is yes.

```text
changed risk
  -> cheapest direct evidence
  -> residual-risk check
  -> deeper boundary evidence only when justified
```

This is not a mandatory test ladder.

## Gate Classes

| Gate | Purpose | Typical evidence | Default use |
| --- | --- | --- | --- |
| G0 — No executable gate | No executable/runtime risk changed | documentation/review evidence | pure docs, agent knowledge, comments, non-executable metadata |
| G1 — Package integrity | Prove affected package still compiles/builds | install, typecheck, build, generated-file consistency | executable client/server changes |
| G2 — Focused behavior | Prove changed policy/interaction | unit, component, focused domain tests | behavior-bearing code |
| G3 — Runtime boundary | Prove persistence/runtime/container contract | integration, migration smoke, container build | DB, transaction, file/artifact, Docker/Compose boundaries |
| G4 — Critical journey | Prove a cross-boundary user outcome | explicitly selected Playwright journeys | material browser/workflow integration |
| G5 — Qualification | Broad regression confidence | selected broader suite/full critical suite | release qualification or genuinely broad blast radius |

A higher gate does not replace a cheaper gate when both prove different risks. Conversely, a higher gate must not be added merely as ceremony.

## Default Gate Selection Matrix

| Changed boundary | Automatic repository gate | Additional evidence only when required |
| --- | --- | --- |
| `.agents/**`, Markdown, non-executable docs | none | factual inspection when claims depend on code/runtime |
| `client/src/**` and client build inputs | Client CI | selected Critical E2E when browser/cross-boundary behavior materially changes |
| generic `server/src/**` and server build inputs | Server CI | focused integration when DB/transaction/runtime behavior is not proven by units |
| FTI Process / contextual authority / Process notification / Process TTE code | Server CI + FTI Domain CI | selected Critical E2E for material end-to-end workflow changes |
| Prisma schema/migration/recovery inputs | Server CI when schema/build input applies + Migration Smoke | targeted integration/E2E only for affected product behavior |
| Compose/environment contract | Compose Config | Container Build when production container inputs are affected |
| Dockerfiles / production container runtime files | Container Build | deployment smoke only when release/deploy is explicitly in scope |
| E2E specs/harness/registry | Critical E2E registry audit | selected browser run if executable journey semantics or shared harness behavior changed |
| cross-boundary user journey | package/domain gates for touched code + explicitly selected Critical E2E | broader regression only if blast radius cannot be bounded |

The matrix is a default. A logical change may require less or more evidence if the actual risk boundary differs, but skipped relevant gates must be explained.

## CI Ownership

### Client CI

Client CI is the automatic G1/G2 baseline for application-facing client inputs.

It verifies:

1. frozen dependency install;
2. production build and route generation;
3. committed generated route-tree consistency;
4. TypeScript typecheck;
5. unit/component tests.

E2E specs and Playwright harness files are intentionally not a reason to run the entire client application baseline by themselves.

### Server CI

Server CI is the automatic G1/G2 baseline for executable server source, package/build configuration, and Prisma schema inputs needed by application compilation.

It verifies:

1. frozen dependency install;
2. Prisma validation and client generation;
3. TypeScript typecheck;
4. core unit tests.

Do not use Server CI as a proxy for Dockerfile, migration SQL, browser, or deployment correctness.

### FTI Domain CI

FTI Domain CI is a focused G2 gate for the target FTI workflow boundary. It runs only when Process administration/context, organizational authority, Process-bound authoring/review/approval/revocation, Process notifications, Process TTE, or their persisted Prisma contract changes.

It protects the target-domain policies that are intentionally outside the broad legacy/core unit baseline.

It must not become a universal server gate.

### Migration Smoke

Migration Smoke is G3 evidence and runs only for migration-relevant inputs.

It must verify the runtime-matched MariaDB path, including:

- recovery-script syntax where applicable;
- Prisma schema validation/client generation;
- full migration chain from an empty database;
- `prisma migrate status` clean state;
- migration-history completeness;
- durable database invariants that the migration chain promises;
- E2E seed compatibility when the changed migration/seed boundary requires it.

Schema validation alone is not proof that migration SQL works.

### Compose Config

Compose Config is a cheap G3 configuration gate. It validates:

- production Compose resolution;
- integration-test Compose resolution;
- canonical external production environment contract.

It does not prove that a Dockerfile can build.

### Container Build

Container Build is G3 evidence for production container inputs. It runs only when production Compose build wiring, Dockerfiles, or production container runtime files change.

It builds the backend and frontend images through the production Compose build contract.

Do not run application domain suites merely because a Dockerfile or container entrypoint changed.

### Critical E2E

Critical E2E has two responsibilities:

1. **Registry audit** — cheap automatic verification when journey specs/harness/registry change.
2. **Selected browser journeys** — explicit G4 execution using `workflow_dispatch` with a required journey selection.

There is **no permanent default milestone journey set**.

Examples:

```text
J31 J32 J33 J34
J35,J36,J37,J38
--all
```

`--all` means intentional G5-style broad qualification. It is never the default.

When a milestone introduces new journeys, the active iteration records which journeys prove that milestone. After the milestone closes, those IDs must not remain embedded as the default gate for unrelated future work.

## Critical E2E Selection Rule

For a logical change or milestone:

- run every new or materially changed journey that directly proves the delivered capability;
- add older regression journeys only when the changed behavior can plausibly affect the boundary they protect;
- prefer the smallest coherent regression set that detects material cross-boundary breakage;
- do not run `J01..JNN` merely because `JNN` is newest;
- do not make historical milestone journeys permanent gates;
- use the full journey set only for broad shared-harness/auth/seed/runtime changes, unbounded cross-cutting risk, regression investigation that indicates wider coupling, or explicit release qualification.

A selected browser run is evidence for the exact source revision that executed it.

## Mandatory Evidence by Risk Boundary

### Bounded code behavior

Usually require:

- focused behavior evidence when meaningful;
- affected package typecheck/build evidence appropriate to the package;
- targeted lint only when lint is relevant and its baseline is trustworthy.

### User-visible frontend workflow

Use component/unit evidence for local interaction and add browser evidence only when router, server contract, authentication, persistence, browser APIs, or multi-step workflow integration materially matters.

### Authorization / Process relationship / organizational authority

Verify both permitted and denied paths.

For Process access, include unrelated Process/Process Team denial when relevant.

For final authority resolution:

```text
FACULTY    -> DEAN
DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
```

The same contextual authority boundary applies to Process-bound revocation. `SUPER_ADMIN` is not an implicit workflow bypass.

### Workflow transition / concurrency

When the change affects workflow state or atomicity, verify:

- valid source state;
- stale/invalid transition behavior;
- persistence/audit side effects;
- no orphan side effects after failed/raced transitions;
- transaction boundary when atomicity is part of the product promise.

Unit evidence is insufficient when the invariant depends on actual persistence or transaction behavior.

### TTE / PDF / public verification

Select evidence for the changed part of the chain:

- contextual authority;
- credential/error handling;
- signing operation;
- persisted signing evidence;
- artifact generation/storage;
- effective-state transition;
- QR/public verification.

Use G4 browser evidence when the delivered behavior spans the complete user-visible chain. Do not force the complete TTE journey for a local helper change that cannot affect it.

### Public archive / discovery

When Process-native public discovery changes, protect the applicable invariants:

- `ProcessSopBinding` is authoritative for Process-bound classification;
- only current `BERLAKU` versions with official `PUBLISHED` PDF artifacts are discoverable;
- faculty/department Process context is correct;
- Process selection scopes the SOP list correctly;
- global target search does not duplicate a Process-bound SOP through legacy fallback;
- promised legacy/unbound compatibility remains operable;
- public document action resolves the official persisted artifact;
- revocation removes current discovery/public PDF availability while preserving historical evidence.

Escalate to browser E2E when the change spans SQL classification, HTTP contract, route state, browser discovery, artifact serving, or revocation behavior end-to-end.

### Notifications

Protect the affected notification invariants:

- recipient resolution;
- event-to-recipient mapping;
- read/unread behavior;
- action destination;
- absence of unintended delivery;
- Process/legacy history isolation;
- duplicate-recipient collapse when applicable;
- transaction participation when atomic workflow feedback is promised.

Realtime refresh is post-commit presentation behavior and must not be emitted for a rolled-back transition.

## Integration / Full-Suite Rule

Do not run full integration, full browser, coverage, Compose, migration, or deployment checks on every change.

Run broader integration evidence when:

- persistence/transaction behavior cannot be proven by unit tests;
- a shared adapter/runtime contract changed;
- the blast radius crosses module/package boundaries in a way focused tests cannot bound;
- an observed failure indicates hidden coupling.

Run a broad/full suite when:

- release qualification explicitly requires it;
- shared test/auth/seed/database/browser infrastructure changed broadly;
- a cross-cutting change has genuinely unbounded blast radius;
- targeted evidence exposed a regression pattern that warrants expansion.

Broad testing is an escalation response to risk, not a completion ritual.

## Lint / Static Analysis

Keep TypeScript strictness intact.

Do not make a noisy pre-existing repository-wide lint baseline a universal blocker. Use targeted lint for changed code and promote broader lint only when the baseline is stable enough to be decision-useful.

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

Rules:

- **IMPLEMENTED** — code/config exists; no verification claim yet.
- **VERIFIED** — mandatory risk-selected evidence is green for the exact source revision.
- **INTEGRATED** — the change is merged and relevant integrated-master baseline evidence is green.
- **RELEASE_READY** — integrated behavior satisfies approved acceptance conditions, mandatory risk gates are green, no unresolved stop condition remains, and residual/skipped risk is explicit.
- **RELEASED** — an authorized release action completed.
- **DEPLOYED** — the authorized target environment successfully deployed the released artifact.

A branch-green result is not `INTEGRATED` evidence.

An expensive source-head result such as Critical E2E does not need to be repeated after squash merge when the merged tree is proven identical to the verified source tree; record that tree equivalence explicitly. If the integrated tree differs, rerun the affected evidence.

## Milestone Gate

A milestone may become `RELEASE_READY` only when:

- approved milestone behavior/acceptance conditions are satisfied end-to-end;
- each Slice has sufficient evidence for its changed risk boundary;
- mandatory cross-slice/integrated evidence is green;
- relevant master CI is green;
- no unresolved stop condition remains;
- `CURRENT_ITERATION.md` reflects the actual state and exact evidence;
- skipped relevant gates and residual risk are explicit.

Milestone completion is about integrated user capability, not number of tests, PRs, or green badges.

## Documentation Verification

When a change modifies durable product truth, architecture, repository conventions, quality gates, material rationale, or active iteration state, update the canonical owner only.

Do not copy milestone-specific testing selections into this durable file. Those selections belong in `CURRENT_ITERATION.md` while active/historical evidence remains relevant there.

## Completion Reporting

Report only decision-useful evidence:

- changed behavior/boundary;
- exact source revision;
- checks that passed or failed;
- relevant gates intentionally skipped and why;
- unresolved risk/blockers;
- integration state;
- next meaningful action when work remains.

Do not upgrade confidence beyond the evidence collected.
