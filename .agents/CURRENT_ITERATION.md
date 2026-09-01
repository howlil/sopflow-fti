# Current Iteration

## Shape

**Milestone:** M2 — FTI-native Workflow Experience Cutover  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: make the already-implemented Process/organizational-authority workflow operable as the primary authenticated FTI experience without requiring users to understand legacy `PENYUSUN / EVALUATOR / PJ_* / KEPALA_OPD` workflow semantics.

This milestone is an experience/contract-semantic cutover, not destructive schema cleanup.

## Boundaries

In scope:

- contextual authenticated entry/navigation;
- Process Owner/Member work queues;
- Dean/Head-of-Department approval + TTE discoverability;
- FTI-native target-path workflow vocabulary;
- contextual Process notifications;
- isolation of legacy workflow surfaces as compatibility paths;
- preservation of existing Process authorization, approval, TTE, audit, version, publication, and verification invariants.

Out of scope:

- destructive removal/renaming of legacy schema/history;
- removal of compatibility routes/contracts;
- public archive IA redesign;
- new approval levels or generic approval-chain configuration;
- centralized evaluator semantics;
- `SUPER_ADMIN` workflow bypass;
- any change to the protected Edit SOP workspace unless explicitly requested.

## Position

```text
Milestone plan
  -> Contextual Entry & Navigation        INTEGRATED
  -> Process Work Queues                  INTEGRATED
  -> Contextual Notifications             VERIFIED + INTEGRATED
  -> FTI Workflow Vocabulary              IMPLEMENTED, VERIFICATION PENDING
  -> Legacy Surface Isolation             ACTIVE / IMPLEMENTED, VERIFICATION PENDING
  -> Milestone Gate                       PENDING
```

Current work branch:

```text
m2-legacy-isolation
head: bb57702b73d14f774a901e40f39b101eb53fc072
```

The current branch removes legacy workflow navigation as the primary path for users who already have Process/organizational/platform context while retaining compatibility fallback. It also cleans target-facing workflow copy so users see FTI vocabulary rather than migration/internal terminology.

## Delta

Completed/integrated:

- authenticated `/work` entry based on contextual capability;
- `/work/queue` for Process-bound SOP work;
- Process Owner vs Member actions derived from Process relationship;
- contextual approval/TTE entry from organizational authority;
- target-native Process notification persistence and recipient resolution;
- notification bell composition across legacy + Process read models without rewriting legacy history;
- generated `/work/queue` route tree committed;
- CI router permission returned to `contents: read`.

Implemented but not yet integrated:

- legacy workflow menu isolation for contextual FTI users;
- preservation of non-workflow reference entries such as Pelaksana/Peraturan where still needed;
- fallback legacy navigation only for accounts without target contextual assignment;
- FTI-native wording cleanup on work/approval target surfaces.

## Evidence

Contextual notification logical change:

```text
PR #1: feat(m2): add contextual Process notifications
merged to master: ce9693e6e939fd43da07e5f67b648b6559e9ac37
```

Current merged notification head passed:

- Client CI: production/SSR build, generated route-tree verification, typecheck, unit tests;
- Server CI: Prisma validation/generation, typecheck, core tests, target-domain tests;
- Migration Smoke: full migration chain + Process foundation database invariants.

Protected Edit SOP primary surface remained blob-identical during that logical change.

Verification for `m2-legacy-isolation` has not yet been completed; do not report those changes as integrated or release-ready.

## Milestone Gate

M2 may move to `RELEASE_READY` only when:

- normal Process-bound work is discoverable without legacy role-specific entry points;
- Process Owner vs Member behavior remains correctly scoped;
- Dean/Head-of-Department approval + TTE is discoverable from organizational authority;
- target-facing copy no longer presents legacy centralized evaluator/PJ semantics as product truth;
- contextual notifications remain verified;
- legacy/unbound compatibility remains operable but isolated;
- Client CI and Server CI are green for the integrated milestone state;
- migration/TTE/authorization invariants affected by the integrated state remain green;
- the protected Edit SOP workspace remains unchanged unless the user explicitly changed that boundary.

## Blockers

None currently known.

Stop/escalate if completing M2 requires a destructive migration, removal of required compatibility contracts, a new archive IA decision, changed Process ownership/final authority/TTE semantics, reinterpretation of historical evidence, or modification of the protected Edit SOP workspace without explicit user direction.

## Next Move

Verify `m2-legacy-isolation` with the relevant client gates and protected-surface diff, fix only observed regressions, integrate the logical change to `master` when green, then run the M2 milestone gate against the integrated state.