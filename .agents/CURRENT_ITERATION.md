# Current Iteration

## Shape

**Milestone:** M7 — FTI Account Provisioning & Bootstrap Completion  
**State:** INTEGRATED / RELEASE_READY  
**Integration branch:** `master`

Outcome achieved: from one bootstrap `SUPER_ADMIN`, FTI can provision ordinary accounts through the target administration surface, assign those accounts to Process and organizational-authority context, and operate the contextual SOP workflow without manual database insertion or dependency on pre-seeded workflow identities.

M7 was delivered as one bounded capability milestone. J24-J27 were not split into separate planning cycles or tiny integration PRs.

## Position

```text
J24 Target Account Provisioning              VERIFIED / INTEGRATED
J25 Account → Process Assignment             VERIFIED / INTEGRATED
J26 Account → Organizational Authority       VERIFIED / INTEGRATED
J27 Zero-to-Workflow Bootstrap               VERIFIED / INTEGRATED
M7 milestone gate                            PASS
Release readiness                            READY
Release/deployment                           NOT PERFORMED
```

## Integration Evidence

```text
PR #14 squash merge: cf5b20619b013cc8b03fc62b120f9c69e6b7676c
Verified source head: 29ab68e1a3f1e881bf5ae9e6273e1259f8a8c6e0

Source-head Client CI: 33678075237 PASS
- production build / route generation
- committed generated route-tree consistency
- typecheck
- unit tests

Source-head Server CI: 33678075226 PASS
- Prisma validate/generate
- typecheck
- core unit tests
- FTI target-domain unit tests

Source-head FTI Critical E2E: 33678075278 PASS
- critical registry audit
- risk-selected J20-J27
- disposable MariaDB + Nest + Chromium runtime

Integrated master Client CI: 33678521355 PASS
Integrated master Server CI: 33678521348 PASS
Migration Smoke: not required; no migration-relevant inputs changed
```

The original Client CI failure was a generated TanStack route-tree mismatch for the new `/admin/accounts` route. The exact generated route tree was committed, the normal read-only consistency gate was restored, and both source-head and integrated Client CI passed afterward.

## Verification Selection Preserved

M7 established the repository rule that browser E2E is risk-selected rather than cumulative-by-ID:

```text
Changed M7 capability: J24-J27
Direct affected administration/bootstrap regression: J20-J23
M7 gate: J20-J27
```

Earlier historical journeys remain available for explicit full milestone/release/shared-harness qualification, but they are not automatically permanent gates for unrelated changes.

## Boundaries Preserved

- ordinary provisioned accounts remain `platformRole = USER` unless explicitly changed elsewhere;
- account creation alone grants no Process, final-approval, TTE, or administration authority;
- required legacy Pengguna backing fields remain internal compatibility seams;
- no generic RBAC/permission editor/user groups;
- no invitation email, CSV/bulk import, or SSO;
- no account deletion/history redesign;
- no new password-reset lifecycle;
- no revocation/cabutan product authority decision;
- no schema/migration change;
- no protected Edit SOP workspace implementation change;
- no release/deployment.

## Delta

No M7 implementation, verification, or integration work remains.

Repository guidance now reflects capability-first delivery, Minimum Complete Change, accurate delivery-state transitions, and proportional/risk-selected verification.

## Next Move

**STOP.** M7 is integrated and release-ready. Await an explicit next product objective or explicit release/deployment direction; do not invent M8 or expand product scope from deferred/nice-to-have work.