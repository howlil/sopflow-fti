# Current Iteration

## Shape

**Milestone:** M2 — FTI-native Workflow Experience Cutover  
**State:** RELEASE_READY  
**Integration branch:** `master`

Outcome: the authenticated product experience now uses Process relationships, organizational authority, and platform administration as the primary FTI workflow model without requiring users to operate through legacy `PENYUSUN / EVALUATOR / PJ_* / KEPALA_OPD` semantics for Process-bound SOP work.

This milestone completed the experience/contract-semantic cutover. It did not perform destructive legacy schema cleanup.

## Position

```text
Contextual Entry & Navigation        VERIFIED + INTEGRATED
Process Work Queues                  VERIFIED + INTEGRATED
Contextual Notifications             VERIFIED + INTEGRATED
FTI Workflow Vocabulary              VERIFIED + INTEGRATED
Legacy Surface Isolation             VERIFIED + INTEGRATED
Milestone Gate                       PASS
```

No implementation slice remains active for M2.

## Delivered Delta

- authenticated `/work` entry is capability/context driven;
- `/work/queue` is the primary Process-bound SOP work surface;
- Process Owner and Member actions are derived from Process relationship;
- Dean / Head-of-Department approval and TTE entry is derived from organizational authority;
- Process workflow notifications resolve contextual recipients and use target-native persistence;
- notification presentation can compose Process and legacy sources without rewriting legacy history;
- target work/approval/navigation copy uses FTI workflow vocabulary;
- users with target contextual capability no longer see legacy workflow navigation as the primary path;
- accounts without target contextual assignments retain compatibility fallback;
- Pelaksana and Peraturan support/reference surfaces remain available where applicable;
- protected Edit SOP workspace behavior was not modified.

## Integration Evidence

Contextual notifications:

```text
PR #1
merge: ce9693e6e939fd43da07e5f67b648b6559e9ac37
Client CI: 33542642051  PASS
Server CI: 33542646755  PASS
Migration Smoke: 33542646940  PASS
```

Legacy isolation + FTI vocabulary:

```text
PR #2
PR Client CI: 33546862594  PASS
merge: 246b2cb574c1dc166996be21bdbf5b3d6dee6759
integrated master Client CI: 33547088255  PASS
```

Integrated Client CI verified:

- dependency install;
- production/SSR build;
- generated route-tree consistency;
- TypeScript typecheck;
- unit/component tests.

## Unchanged Risk Boundaries

The integrated delta after the last server/migration gate contains no changes under:

```text
server/**
server/prisma/**
client/src/pages/penyusun/sop/detail/DetailSOPPenyusun.tsx
```

Therefore the previously green Server CI and Migration Smoke evidence remains applicable to the unchanged backend/Prisma subtree. No new backend authorization, persistence, migration, TTE, or public-contract behavior was introduced by the final M2 logical change.

The protected Edit SOP workspace does not appear in the final M2 isolation/vocabulary diff and remains outside the milestone change surface.

## Milestone Gate

PASS:

- normal Process-bound work is discoverable without legacy role-specific entry points;
- Process Owner vs Member behavior remains contextually distinct;
- Dean / Head-of-Department approval + TTE is discoverable through organizational authority;
- target-facing copy no longer presents centralized evaluator/PJ semantics as FTI product truth;
- contextual Process notifications are verified;
- legacy/unbound compatibility remains available but isolated from the primary target workflow;
- integrated Client CI is green;
- backend/migration evidence remains green for an unchanged server/Prisma subtree;
- no target authorization, TTE, publication, or historical-evidence invariant changed in the final slice;
- protected Edit SOP workspace remains unchanged;
- no milestone stop condition remains.

## Residual Compatibility

Intentional compatibility seams remain outside M2 cleanup scope:

- legacy routes/roles/status names where still required;
- legacy/unbound SOP workflow behavior;
- transitional OPD-era persistence fields/bindings;
- historical data/evidence.

Their existence does not block M2 because destructive cleanup was explicitly out of scope.

## Delivery State

```text
implemented:    YES
verified:       YES
integrated:     YES
release-ready:  YES
released:       NO EVIDENCE / NOT CLAIMED
deployed:       NO EVIDENCE / NOT CLAIMED
```

## Next Move

**STOP.** M2 is complete and release-ready. Do not invent or start M3 until the user establishes a new milestone or requests release/deployment work.