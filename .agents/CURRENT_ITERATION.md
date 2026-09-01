# Current Milestone

Milestone: Process-bound SOP Workflow Cutover
Delivery State: MILESTONE_ACTIVE
Current Integration Branch: `master`
Working Ref: `feat/contextual-final-approval`
Created: 2026-09-01

## Milestone Shape

Move the FTI target SOP path from legacy OPD/global-role workflow semantics to contextual Process + organizational authority semantics while preserving document/version/TTE integrity.

Target outcome:

```text
Process Team
  -> author Process-bound SOP
  -> Process Owner review
  -> contextual final approval
       -> FACULTY -> DEAN
       -> DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
  -> contextual TTE by resolved authority
  -> legal/effective artifact
  -> BERLAKU
```

Milestone boundaries:

- preserve legacy/unbound SOP compatibility until its explicit contract-cleanup slice;
- no SUPER_ADMIN workflow bypass;
- Process relationship and organizational authority remain separate axes;
- final approval and TTE remain distinct responsibilities;
- preserve one-active-version/effective-state, audit, signature, and public-verification invariants;
- no destructive historical bulk remapping.

## Slice State

| Slice | Outcome | State |
| --- | --- | --- |
| Process Foundation | FTI Process/Department/context foundation | COMPLETE |
| Process-owned Authoring | Process Owner/Member contextual authoring | COMPLETE |
| Global Pelaksana / Procedure Cutover | global reusable actor catalog + Process procedure authorization | COMPLETE |
| Process Owner Review | Process Owner review/revision/accept path | COMPLETE |
| Migration Reliability | runtime-matched migration smoke + failed-migration recovery | COMPLETE |
| Contextual Final Approval | Dean/Kadep resolver, assignment, approver queue, approval evidence | VERIFIED_PENDING_INTEGRATION |
| Contextual TTE / Effective-State Cutover | resolved Dean/Kadep signer -> TTE -> BERLAKU | NEXT |

Historical sprint numbers are no longer the planning model; they are implementation history only.

## Current Position

`EXECUTE SLICES CONTINUOUSLY -> INTEGRATE VERIFIED LOGICAL CHANGE`

The Contextual Final Approval slice is verified. The immediate action is to integrate the accumulated verified branch stack into `master`, then continue directly with Contextual TTE without a new sprint-planning cycle.

## Completed Delta

### Migration reliability

- Added path-scoped Migration Smoke on runtime-matched MariaDB 11.4.
- Full historical migration chain, migration history, and Process foundation invariants are verified.
- Added fail-closed recovery for `20260901163000_add_fti_process_foundation` P3018/P3009 partial-state recovery.

### Contextual final approval

- Added persistent organizational authority assignments for Dean and Department Heads.
- Faculty Process resolves only to Dean; Department Process resolves only to that Department's Head.
- `SUPER_ADMIN` may configure authority but receives no approval capability from platform role.
- Added `ProcessFinalApproval` evidence and approver queue/read/approve APIs.
- Only latest Process-bound SOP version is eligible; stale versions and legacy/unbound SOPs are excluded.
- Final approval does not execute TTE or make SOP `BERLAKU`.
- Added `/admin/authorities` and `/approval` client surfaces.

## Evidence

Migration Smoke run `33522522783`: PASS for Contextual Final Approval persistence; full migration chain and history checks passed.

Server CI run `33523846138`: PASS for final server implementation including stale-version protection.

Client CI run `33525633521`: PASS:

- production + SSR build;
- generated route consistency;
- TypeScript typecheck;
- 91/91 test files;
- 404 tests passed, 2 skipped.

No Prisma schema/migration or production server/client behavior changed after those verified implementation revisions; subsequent changes are agent/delivery-state documentation.

## Next Slice

Contextual TTE / Effective-State Cutover.

Required behavior:

```text
ProcessFinalApproval exists
  -> signer resolved from the same organizational authority boundary
  -> FACULTY: DEAN
  -> DEPARTMENT: relevant HEAD_OF_DEPARTMENT
  -> target TTE path signs the approved latest Process-bound SOP
  -> legal/effective artifact is persisted
  -> status becomes BERLAKU
  -> previous BERLAKU version becomes DIGANTIKAN when applicable
```

Risk boundaries to verify:

- legacy `KEPALA_OPD` must not authorize Process-bound TTE;
- SUPER_ADMIN must not bypass signer resolution;
- approval evidence and signer authority must match the Process context;
- one-active-version/effective-state invariant remains intact;
- TTE hashing/encryption/signature/verification behavior remains valid;
- legacy/unbound SOP TTE remains compatibility behavior unless explicitly changed.

## Milestone Gate

Do not mark the milestone RELEASE READY until:

- Process-bound authoring/review/final-approval/TTE works end-to-end for both FACULTY and DEPARTMENT scope;
- negative cross-scope/cross-department authorization is verified;
- migration chain remains green;
- legal/effective state and one-active-version invariants are verified;
- target public verification/archive behavior remains correct for effective documents;
- no material unresolved compatibility ambiguity blocks release.

## Stop Conditions

Stop continuous execution if the next slice requires:

- changing approved legal/TTE product semantics;
- destructive migration or historical reinterpretation;
- new material data ownership/security/public-contract boundary;
- a material architecture change not already implied by the milestone;
- ambiguous signer/legal authority semantics that cannot be resolved from `PROJECT.md` and existing approved rules.

## Next Move

Integrate the verified accumulated branch into `master`, update this state to `INTEGRATED`, then execute Contextual TTE as the next milestone slice. Do not create a new sprint plan or stacked sprint branch merely because the slice changes.
