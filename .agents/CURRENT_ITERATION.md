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
Process Work + Owner Review Journey         VERIFIED + INTEGRATED
Final Approval + Notification Journey       ACTIVE / RUNTIME GATE
TTE/Public Integrity Boundary               PLANNED
Milestone Gate                              PENDING
```

Current branch:

```text
m3-final-approval-notification
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

Contextual entry/navigation:

```text
PR #4
merge: c8d892b6ae226e5d8f7b268cfd2c1b0339d13525
FTI Critical E2E: 33549078870 PASS
```

Process work + owner review:

```text
PR #5
merge: ece289ae27bfa4de6b8187b2dafe4464f55ed444
Client CI: 33551088103 PASS
FTI Critical E2E: 33551087697 PASS
```

J09 proves in Chromium + Nest + migrated/seeded MariaDB:

- Process Member sees Process draft in `/work/queue` and submits it through the existing workspace;
- Process Owner receives the work as `Review Process Owner` and can request revision;
- Process Member receives the same SOP back as `Perlu revisi`;
- the protected workspace implementation remains unchanged.

The first J09 runtime attempt exposed only an E2E fixture contract mismatch: generated `namaPelaksana` exceeded the API maximum of 15 characters. The fixture was shortened; no production behavior changed.

## Active Slice — J10 Final Approval + Notification

Precondition:

- create one complete Faculty Process SOP using the J09 target fixture;
- submit it to Process Owner review via API because Member submit is already browser-verified by J09;
- keep Owner `ACCEPT`, notification consumption, and Dean approval as browser actions.

Browser behavior under test:

```text
Process Owner
  -> opens SOP under review
  -> Terima
  -> SOP becomes Siap untuk persetujuan

Dean
  -> receives FINAL_APPROVAL_REQUESTED notification
  -> notification routes to /approval
  -> sees Faculty · Dekan authority row
  -> Setujui
  -> SOP becomes Persetujuan akhir tercatat · siap TTE
```

J10 intentionally stops before `Tanda tangani`. PDF generation, PIN/TTE signing, transition to `BERLAKU`, and public integrity remain owned by the next slice.

Runtime gate:

- J10 registered beside J01–J09 in the existing audited critical set;
- local critical runner includes J10 with per-journey DB reset;
- path-scoped FTI CI executes J08–J10 on one disposable MariaDB/Nest/Chromium stack.

## Guardrail

The protected Edit SOP workspace may be exercised as existing user-visible behavior by E2E tests, but its implementation/layout/interaction contract must not be modified to make tests pass.

## Stop Conditions

Stop/escalate if J10 requires changing approved workflow semantics, weakening authorization/security, destructive migration, public-contract change, or modifying the protected workspace implementation.

## Next Move

Run J08–J10 in the path-scoped FTI browser gate. Fix only observed test/fixture/runtime defects. Integrate J10 when green, then proceed to the TTE/Public Integrity boundary.
