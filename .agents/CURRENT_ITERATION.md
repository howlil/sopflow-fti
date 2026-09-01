# Current Iteration

## Shape

**Milestone:** M3 — FTI Critical Journey Hardening  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: prove the M2 FTI-native workflow through deterministic target-specific integration/browser journeys so regressions in contextual navigation, Process authorization, Process Owner review, contextual final approval, notifications, and TTE handoff are caught without relying on legacy evaluator-role journeys.

M3 is a reliability/verification milestone. It must not change approved product semantics merely to make tests easier.

## Boundaries

In scope:

- target identities/fixtures for Process Owner, Process Member, Dean, and Head of Department;
- authenticated contextual entry/navigation isolation;
- Process work queue + Process authorization;
- Process Member submit and Process Owner review/revision;
- contextual final-approval handoff + notifications;
- TTE/public-integrity boundary where the existing signing harness can prove it safely;
- path-scoped browser-runtime CI proportional to target FTI surfaces.

Out of scope:

- new product features/workflow states;
- destructive legacy cleanup;
- changed Process ownership/final-authority semantics;
- authentication/authorization/TTE bypasses for tests;
- release/deployment work;
- protected Edit SOP workspace behavior changes.

## Position

```text
Target E2E Identity + Fixture Foundation    VERIFIED + INTEGRATED
Contextual Entry + Navigation Journey       VERIFIED + INTEGRATED
Process Work + Owner Review Journey         ACTIVE / RUNTIME GATE
Final Approval + Notification Journey       PLANNED
TTE/Public Integrity Boundary               PLANNED
Milestone Gate                              PENDING
```

Current branch:

```text
m3-process-owner-review
```

## Integrated Evidence

Foundation:

```text
PR #3
merge: ad96c4532fc1f944d50def1638d21183c23c29aa
Client CI: 33548230111       PASS
Server CI: 33548230152       PASS
Migration Smoke: 33548230125 PASS
```

Contextual browser runtime:

```text
PR #4
merge: c8d892b6ae226e5d8f7b268cfd2c1b0339d13525
FTI Critical E2E: 33549078870 PASS
```

J08 proves in real Chromium + Nest + migrated/seeded MariaDB:

- Process Owner -> Process work capability, legacy workflow nav isolated;
- Process Member -> Process work without final-approval capability;
- Dean -> contextual approval/TTE without Process authoring capability;
- Head of Department -> contextual approval/TTE without Process authoring capability;
- no page/app-shell errors.

The first J08 runtime attempt exposed only E2E wiring: Vite dev targeted port 3000 while the test backend used 3001. CI now sets `VITE_API_BASE_URL` explicitly; production auth/cookie behavior was not changed.

## Active Slice — J09 Process Owner Review

Precondition:

- create one complete Process-bound SOP as the target Process Member through existing public APIs;
- keep it in `DRAFT`;
- setup mutations live outside the journey spec;
- do not modify the protected Edit SOP workspace implementation.

Browser behavior under test:

```text
Process Member /work/queue
  -> sees Draft + Lanjutkan SOP
  -> opens existing workspace
  -> Kirim untuk review

Process Owner /work/queue
  -> sees Review Process Owner + Review SOP
  -> opens existing workspace
  -> Minta revisi

Process Member /work/queue
  -> sees Perlu revisi + Lanjutkan SOP
```

This slice intentionally chooses `REVISION`, not `ACCEPT`, so final-approval recipient/notification behavior remains owned by the next vertical slice.

Runtime gate:

- J09 registered beside J01–J08 in the existing audited critical set;
- local critical runner keeps per-journey DB reset behavior;
- path-scoped FTI CI executes J08 + J09 against one disposable target stack;
- J08 is read-only and J09's mutations do not alter Process/authority capability counts asserted by J08.

## Guardrail

The protected Edit SOP workspace may be exercised as existing user-visible behavior by E2E tests, but its implementation/layout/interaction contract must not be modified to make tests pass.

## Stop Conditions

Stop/escalate if J09 requires changing approved workflow semantics, weakening authorization/security, destructive migration, public-contract change, or modifying the protected workspace implementation.

## Next Move

Run J08 + J09 in the path-scoped FTI browser gate. Fix only observed test/fixture/runtime defects. Integrate J09 when green, then proceed to contextual final approval + notification.