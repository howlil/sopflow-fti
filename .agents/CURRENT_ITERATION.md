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
  -> Target E2E Identity + Fixture Foundation    ACTIVE
  -> Contextual Entry + Navigation Journey       PLANNED
  -> Process Work + Owner Review Journey         PLANNED
  -> Final Approval + Notification Journey       PLANNED
  -> TTE/Public Integrity Boundary               PLANNED
  -> Milestone Gate                              PENDING
```

Current branch:

```text
m3-critical-journey-foundation
```

## Evidence / Gap

M2 is release-ready and its unit/CI gates are green, but the existing browser journey set is still centered on legacy role/evaluation flows. There is no dedicated Process-native critical browser journey for `/work` / `/work/queue` / Process Owner review / contextual authority.

The existing E2E seed contains five legacy-role identities only. The shared business fixture also caches authentication by legacy role, which is insufficient for multiple target identities that may intentionally share the same transitional legacy role while holding different Process/authority capabilities.

## Active Slice

### Target E2E Identity + Fixture Foundation

Required behavior:

- preserve all existing legacy E2E identities and expectations;
- add separate target-specific users instead of repurposing legacy accounts;
- seed deterministic Process/Process Team/organizational-authority context using existing production schema and invariants;
- key shared authentication cache by concrete identity, not legacy role;
- add the first target browser proof for `/work` capability/navigation isolation;
- do not alter production authorization or navigation to accommodate tests.

Verification:

- server seed TypeScript/Prisma compatibility;
- frontend E2E TypeScript compatibility;
- focused target browser journey in Docker-backed E2E environment when available;
- existing relevant auth/role-access journeys must remain compatible.

## Stop Conditions

Stop/escalate if target journey coverage requires changing approved workflow behavior, weakening authentication/authorization/TTE security, destructive migration, public-contract changes, or modifying the protected Edit SOP workspace.

## Next Move

Implement target-specific seed identities and relationships, make the business E2E auth cache identity-safe, then add the first contextual `/work` navigation/isolation journey.