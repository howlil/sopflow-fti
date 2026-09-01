# Current Iteration

## Shape

**Milestone:** M3 — FTI Critical Journey Hardening  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: prove the M2 FTI-native workflow through deterministic target-specific integration/browser journeys so regressions in contextual navigation, Process authorization, Process Owner review, contextual final approval, notifications, and TTE handoff are caught without relying on legacy evaluator-role journeys.

M3 is a reliability/verification milestone. It must not change approved product semantics merely to make tests easier.

## Boundaries

In scope:

- dedicated E2E identities/fixtures for Process Owner, Process Member, Dean, and Head of Department contexts;
- target-context authenticated entry/navigation/isolation journeys;
- Process-bound SOP work queue and authorization journeys;
- Process Owner submit/review + contextual notification journey;
- contextual final-approval handoff and authority isolation;
- TTE handoff/public-integrity verification where the existing signing harness can prove it without weakening security boundaries;
- critical-journey command/CI coverage proportional to the new tests.

Out of scope:

- new product features or workflow states;
- destructive legacy schema/route cleanup;
- changing Process ownership/final-authority semantics;
- bypassing authentication, TTE, rate limits, or authorization for tests;
- production deployment/release work;
- protected Edit SOP workspace behavior changes.

## Position

```text
Milestone plan
  -> Target E2E Identity + Fixture Foundation    VERIFIED + INTEGRATED
  -> Contextual Entry + Navigation Journey       ACTIVE / RUNTIME GATE
  -> Process Work + Owner Review Journey         PLANNED
  -> Final Approval + Notification Journey       PLANNED
  -> TTE/Public Integrity Boundary               PLANNED
  -> Milestone Gate                              PENDING
```

Current branch:

```text
m3-contextual-entry-runtime
```

## Delivered Evidence

Foundation logical change:

```text
PR #3
merge: ad96c4532fc1f944d50def1638d21183c23c29aa
Client CI: 33548230111       PASS
Server CI: 33548230152       PASS
Migration Smoke: 33548230125 PASS
```

Foundation now provides:

- four dedicated target identities: Process Owner, Process Member, Dean, Head of Department;
- deterministic Faculty + Department Process context;
- deterministic Process membership and organizational authority assignments;
- identity-keyed shared E2E authentication instead of legacy-role-keyed sessions;
- J08 registered in the existing audited critical journey set;
- Migration Smoke validation of the target seed against the full migrated MariaDB schema.

The initial seed-validation smoke run exposed a missing `prisma generate` step in Migration Smoke. The workflow was corrected and the final run passed. No production schema change was required.

## Active Slice

### Contextual Entry + Navigation Runtime Gate

J08 already expresses the required browser assertions. The remaining gap is automated runtime proof.

Current logical change adds one path-scoped GitHub Actions gate that:

- provisions disposable MariaDB 11.4;
- generates Prisma client;
- resets through the real migration chain and loads the target E2E seed;
- starts the Nest backend with committed test-only environment values;
- installs Chromium;
- audits the critical journey registry;
- executes only J08 in Chromium;
- captures backend logs on failure;
- does not run on unrelated repository changes.

J08 must prove:

- Process Owner sees Process work as primary and no legacy `SOP` workflow navigation;
- Process Member sees Process work but no final-approval capability;
- Dean sees contextual approval/TTE but no Process authoring capability;
- Head of Department sees contextual approval/TTE but no Process authoring capability;
- no browser page errors or application-shell errors occur.

## Guardrail

The protected Edit SOP workspace remains outside M3 changes. Do not modify it to make E2E easier.

## Stop Conditions

Stop/escalate if target journey coverage requires changing approved workflow behavior, weakening authentication/authorization/TTE security, destructive migration, public-contract changes, or modifying the protected Edit SOP workspace.

## Next Move

Verify the new path-scoped FTI Critical E2E workflow on J08, integrate it when green, then start the Process Work + Owner Review journey slice.