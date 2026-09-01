# Current Milestone

Milestone: Process-bound SOP Workflow Cutover
Delivery State: MILESTONE_ACTIVE
Integration Branch: `master`
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
| Process Foundation | FTI Process/Department/context foundation | INTEGRATED |
| Process-owned Authoring | Process Owner/Member contextual authoring | INTEGRATED |
| Global Pelaksana / Procedure Cutover | global reusable actor catalog + Process procedure authorization | INTEGRATED |
| Process Owner Review | Process Owner review/revision/accept path | INTEGRATED |
| Migration Reliability | runtime-matched migration smoke + failed-migration recovery | INTEGRATED |
| Contextual Final Approval | Dean/Kadep resolver, assignment, approver queue, approval evidence | INTEGRATED |
| Contextual TTE / Effective-State Cutover | resolved Dean/Kadep signer -> TTE -> BERLAKU | ACTIVE |

Historical sprint numbers are implementation history only and are no longer the planning model.

## Current Position

`EXECUTE SLICES CONTINUOUSLY -> CONTEXTUAL TTE / EFFECTIVE-STATE CUTOVER`

The previously accumulated verified stack is now integrated to `master`. The milestone continues directly with Contextual TTE; no new sprint plan or stacked sprint branch is required.

## Completed Delta

### Migration reliability

- Path-scoped Migration Smoke on runtime-matched MariaDB 11.4.
- Full historical migration chain, migration history, and Process foundation invariants verified.
- Fail-closed recovery for `20260901163000_add_fti_process_foundation` P3018/P3009 partial-state recovery.

### Contextual final approval

- Persistent organizational authority assignments for Dean and Department Heads.
- Faculty Process resolves only to Dean; Department Process resolves only to that Department's Head.
- `SUPER_ADMIN` may configure authority but receives no approval capability from platform role.
- `ProcessFinalApproval` evidence and approver queue/read/approve APIs.
- Only latest Process-bound SOP version is eligible; stale versions and legacy/unbound SOPs are excluded.
- Final approval does not execute TTE or make SOP `BERLAKU`.
- `/admin/authorities` and `/approval` client surfaces.

## Integrated Evidence

Migration Smoke run `33522522783`: PASS for Contextual Final Approval persistence; full migration chain/history checks passed.

Server CI run `33523846138`: PASS for final server implementation including stale-version protection.

Client CI run `33525633521`: PASS:

- production + SSR build;
- generated route consistency;
- TypeScript typecheck;
- 91/91 test files;
- 404 tests passed, 2 skipped.

## Active Slice — Contextual TTE / Effective-State Cutover

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

Risk boundaries:

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

Stop continuous execution if the active slice requires:

- changing approved legal/TTE product semantics;
- destructive migration or historical reinterpretation;
- new material data ownership/security/public-contract boundary;
- a material architecture change not already implied by the milestone;
- ambiguous signer/legal authority semantics that cannot be resolved from `PROJECT.md` and existing approved rules.

## Next Move

Inspect the existing TTE signing path and replace legacy `KEPALA_OPD` authority only for Process-bound SOPs with the contextual Dean/Kadep resolver, preserving legacy/unbound compatibility and effective-state invariants.
