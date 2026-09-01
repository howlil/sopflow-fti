# Current Iteration

Iteration: Sprint 5 — Process Owner Review
Delivery State: VERIFIED_BRANCH
Branch: `feat/process-owner-review`
Created: 2026-09-01

## Feature Shape

Sprint 5 replaces the target centralized evaluator handoff for Process-bound SOPs with contextual Process Owner review while leaving legacy unbound SOPs on the compatibility workflow.

Implemented target shape:

```text
Process Owner / Member
  -> author Process-bound SOP
  -> submit for review

Process Owner
  -> review
     -> request revision -> Process Team edits again
     -> accept -> ready for final approval
```

No global reviewer role, Super Admin bypass, Dean/Kadep approval, or TTE cutover is introduced in this sprint.

## Current Position

`QUALITY GATES -> STOP`

Sprint 5 implementation is verified on its branch. It is not merged, released, or deployed.

## Completed Delta

- `ProcessContextService.assertCanReview` authorizes review only from the Process Owner relationship.
- Process Owner and Process Members may submit a Process-bound SOP for review through the target Process API.
- Process-bound submit bypasses legacy `PengajuanEvaluasi`; persisted `SEDANG_DIEVALUASI` is temporarily reused as the target “under Process Owner review” state.
- Process Owner may return a submitted SOP for revision or accept it as ready for final approval.
- Persisted `REVISI_DARI_EVALUATOR` is temporarily reused as target “returned for revision”.
- Persisted `MENUNGGU_TTD_PJ_EVALUATOR` is temporarily reused as target “ready for final approval”.
- Review status transitions are compare-and-set atomic and write the acting user to the existing discrete STATUS audit log in the same transaction.
- Concurrent stale review decisions fail rather than overwriting the winning decision.
- Client SOP editor uses Process-aware copy/actions for Process-bound SOPs and does not expose a final approval action in this sprint.
- Legacy unbound SOPs continue using the existing evaluator compatibility path.

## Transitional Status Mapping

```text
Target semantic                 Persisted compatibility status
---------------------------------------------------------------
Under Process Owner review      SEDANG_DIEVALUASI
Returned for revision           REVISI_DARI_EVALUATOR
Ready for final approval        MENUNGGU_TTD_PJ_EVALUATOR
```

These names are implementation compatibility seams, not target domain vocabulary.

## Verification Evidence

### Server

- Prisma validate/generate: PASS.
- Typecheck: PASS.
- Core unit suite: PASS.
- Focused FTI target-domain unit tests: PASS.
- Server CI run `33513647044`: PASS on commit `4f524321f758bfe7314cedcc65ab81b7c378ff5c`.

Focused review coverage includes:

- Process Member/Owner submit,
- Process Owner-only review,
- revision transition,
- acceptance transition,
- invalid-state rejection,
- stale concurrent-decision rejection.

### Client

- Production build and route regeneration: PASS.
- Generated route-tree consistency: PASS.
- Typecheck: PASS.
- Unit tests: PASS.
- Client CI run `33514209001`: PASS on commit `4248b4fa6d2d849501819450588257ae85e662d5`.

## Verification Scope

No Prisma schema or SQL migration changed in Sprint 5, so a database migration rehearsal was not required. Verification stayed at the affected server/client behavior and repository quality gates.

## Residual Compatibility

- Final approval resolver/authority execution remains unchanged; Dean/Kadep approval is not part of Sprint 5.
- TTE remains on the legacy authority path.
- Legacy SOPs without `ProcessSopBinding` still use centralized evaluator compatibility behavior.
- Persisted legacy status names remain as temporary compatibility states for Process review.
- Existing public archive grouping and publication behavior remain unchanged.
- Existing historical migration-chain debt from Sprint 4 remains unrelated and unchanged.

## Next Move

Sprint 6 should implement the contextual final-approval boundary:

```text
READY FOR APPROVAL
  -> FACULTY -> DEKAN
  -> DEPARTMENT -> relevant KADEP
```

That sprint should establish resolver authorization before TTE policy is cut over. TTE must execute the resolved authority, not define it.

Do not merge, release, or deploy Sprint 5 without explicit user authorization.
