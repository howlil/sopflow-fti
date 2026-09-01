# Current Iteration

Iteration: Sprint 7 — Contextual Final Approval
Delivery State: VERIFIED_BRANCH
Branch: `feat/contextual-final-approval`
Created: 2026-09-01

## Feature Shape

Target Process-bound SOP approval is now contextual to organizational authority:

```text
Process Owner accepts latest SOP version
  -> ready for final approval
  -> authority resolver
       -> FACULTY -> DEAN
       -> DEPARTMENT -> HEAD_OF_DEPARTMENT for that department
  -> assigned holder approves
  -> ProcessFinalApproval evidence stored
  -> awaits contextual TTE
```

Final approval is intentionally distinct from TTE and does not make the SOP `BERLAKU`.

## Current Position

`QUALITY GATES -> RELEASE READY -> STOP`

Sprint 7 implementation and branch-level verification are complete. The branch is not merged and is not deployed.

## Completed Delta

### Organizational Authority

- Added persistent organizational authority assignments for Dean and Department Heads.
- Faculty Process approval resolves only to the current Dean assignment.
- Department Process approval resolves only to the Head assigned to that exact Department.
- `SUPER_ADMIN` may maintain authority configuration but receives no final-approval permission or workflow bypass from platform role alone.
- Approver identity is independent from Process Owner/member relationship and legacy global workflow role.

### Contextual Final Approval

- Added `ProcessFinalApproval` evidence for Process-bound SOP versions.
- Added approver queue/read/approve APIs.
- Approval requires a Process-bound SOP and the authority holder resolved from the Process scope.
- Only the latest SOP version is eligible; stale older versions are rejected even if they previously reached the ready status.
- Duplicate final approval is rejected.
- Legacy/unbound SOPs stay on the compatibility workflow.
- Final approval does not execute TTE or transition the SOP to `BERLAKU`.

### Client

- Added Super Admin authority configuration route `/admin/authorities`.
- Added contextual approver inbox route `/approval`.
- Dashboard navigation exposes approval from organizational authority rather than legacy role or platform-admin status.
- TanStack generated route tree is committed and verified clean after production build.
- Client CI permissions were restored to `contents: read` after the one-time generated-route synchronization.

## Verification Evidence

Server CI run `33523846138`: **PASS**.

The verified server slice includes stale-version rejection for contextual final approval. Existing core server tests and focused FTI authority/final-approval tests passed on the final server implementation.

Migration Smoke run `33522522783`: **PASS** on the persistence commit `17250dc30be050d328379a68211faa152e615acf`.

Migration evidence includes:

- runtime-matched MariaDB 11.4 startup;
- Prisma schema validation;
- full historical migration-chain deploy;
- synchronized migration status;
- migration-history completeness with zero unresolved failed rows;
- existing Process foundation database invariant checks.

No Prisma schema or migration changed after that successful Sprint 7 migration run.

Client CI run `33525633521`: **PASS** on commit `d403ca71675e505a2d9e90698864d540cbfbd2a1`.

Client evidence includes:

- production client + SSR build;
- generated route tree consistency;
- TypeScript typecheck;
- 91/91 test files passed;
- 404 tests passed, 2 skipped.

Documentation-only closure commits follow these verified implementation commits and do not change server, client, schema, or migration behavior.

## Compatibility Boundary

- Target final approval currently consumes the existing legacy storage status used around readiness for downstream signing; status vocabulary cleanup is not part of Sprint 7.
- Legacy/unbound SOPs remain on the legacy compatibility approval/TTE flow.
- Contextual final approval does not sign documents, create effective-state artifacts, or produce `BERLAKU`.
- Existing legacy TTE authority must not be treated as target authority for Process-bound SOPs in the next slice.
- No historical bulk mapping or destructive migration was performed.

## Next Move

Sprint 8 — Contextual TTE / Effective-State Cutover:

```text
contextual final approval
  -> resolved Dean/Kadep signer
  -> TTE
  -> legal/effective artifact
  -> BERLAKU
```

The next slice must preserve one-active-version/effective-state invariants while removing legacy `KEPALA_OPD` authority from the Process-bound TTE path. Do not merge, deploy, or release without explicit user authorization.
