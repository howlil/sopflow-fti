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
- TTE/public-integrity boundary using the real existing signing harness;
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
Final Approval + Notification Journey       VERIFIED + INTEGRATED
TTE/Public Integrity Boundary               ACTIVE / RUNTIME GATE
Milestone Gate                              PENDING
```

Current branch:

```text
m3-tte-public-integrity
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

Final approval + notification:

```text
PR #6
merge: e46b0cf73a1ba2db8ef13b176571b46e6efa6f8f
Client CI: 33551654000 PASS
FTI Critical E2E: 33551654201 PASS
```

J10 proves in real Chromium + Nest + migrated/seeded MariaDB:

- Process Owner ACCEPT moves a Faculty Process SOP to contextual final approval;
- Dean receives the target Process notification and follows it to `/approval`;
- the approval row resolves to `Fakultas · Dekan`;
- Dean final approval succeeds and leaves the SOP ready for TTE.

## Active Slice — J11 Process TTE + Public Handoff

Precondition:

- create one complete Faculty Process SOP;
- submit to Process Owner, ACCEPT, and final-approve via API because those actions are already browser-verified by J09/J10;
- prepare Dean TTE credentials using the existing `/tte/profil/setup/generate` flow;
- do not mock or bypass signing.

Browser behavior under test:

```text
Dean /approval
  -> Persetujuan akhir tercatat · siap TTE
  -> Tanda tangani
  -> PIN TTE
  -> real Process TTE signing

Process Member /work/queue
  -> SOP status BerLaku

Public /arsip
  -> Process SOP appears publicly
  -> preview exposes no internal evaluation data
```

The FTI runtime gate enables `PDF_SIGNING_ENABLED=true` only in its disposable test environment so J11 exercises the actual personal-P12 signing path. Production configuration is unchanged.

J11 does not duplicate the full PKCS#7 verification suite already owned by J07. Its purpose is to prove that the contextual Process workflow reaches the same signed/public boundary correctly.

Runtime gate:

- J11 registered beside J01–J10 in the audited critical set;
- local critical runner includes J11 with per-journey DB reset;
- path-scoped FTI CI executes J08–J11 against one disposable MariaDB/Nest/Chromium stack with real PDF signing enabled.

## Guardrail

The protected Edit SOP workspace may be exercised as existing user-visible behavior by E2E tests, but its implementation/layout/interaction contract must not be modified to make tests pass.

## Stop Conditions

Stop/escalate if J11 requires changing approved workflow semantics, weakening authorization/TTE security, destructive migration, public-contract change, or modifying the protected workspace implementation.

## Next Move

Run J08–J11. Fix only observed test/fixture/runtime defects. Integrate J11 when green, then execute the M3 milestone gate and stop.
