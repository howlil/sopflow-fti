# Current Iteration

## Shape

**Milestone:** M11 — Native FTI Runtime Cutover
**State:** IMPLEMENTED / VERIFICATION_PENDING
**Scope:** All six M11 slices: native SOP ownership, native account/authorization prerequisites, approval/TTE/effective lifecycle, complete lifecycle, first-party FTI surface, and explicit legacy isolation.

## Position

```text
S1 Native SOP ownership                 IMPLEMENTED / LOCAL TESTED
S2 Native account and authorization     IMPLEMENTED / LOCAL TYPECHECKED
S3 Approval, TTE, effective lifecycle   IMPLEMENTED / LOCAL TESTED
S4 Version/replacement/revocation       IMPLEMENTED / LOCAL TESTED
S5 First-party FTI surface              IMPLEMENTED / LOCAL TYPECHECKED
S6 Legacy isolation and contract        IMPLEMENTED / DOC + SEARCH AUDITED
Migration-backed proof                  PENDING MIGRATION SMOKE
Integration/release/deployment          NOT PERFORMED
```

## Delta

- `SOP.processId` is the native ownership source; the additive migration backfills it from `ProcessSopBinding` and adds a restrictive foreign key.
- `Pengguna.opdId` is nullable so a fresh native account does not need fabricated OPD membership. Native authorization uses platform role, Process relationship, and Organizational Authority.
- Native authoring, procedure mutation, versioning, Process Owner review, contextual approval, TTE, notifications, revocation, and public FTI discovery read Process context directly. Native paths no longer look up `ProcessSopBinding`.
- OPD fields/routes, legacy roles, evaluation workflow, `ProcessSopBinding`, and unbound SOP rows remain only behind explicit compatibility/historical boundaries. No destructive historical cleanup was performed.
- The protected Edit SOP workspace was not redesigned or behaviorally rewritten.

## Evidence

- `pnpm prisma generate` — PASS
- `pnpm prisma validate` — PASS
- server `pnpm typecheck` — PASS
- client `pnpm typecheck` — PASS
- focused native lifecycle test run — PASS, 11 suites / 55 tests
- native account provisioning test — PASS, 1 suite / 2 tests (including no-OPD account creation)
- client unit test run — PASS, 91 files / 407 tests (2 skipped)
- server lint — NOT CLEAN: repository-wide baseline reports 1,144 errors / 73 warnings, including existing unsafe-test and line-ending/prettier findings; typecheck remains clean
- local Migration Smoke — NOT RUN: Docker daemon unavailable on this host

## Next Move

Run the repository Migration Smoke gate in CI or a host with MariaDB 11.4/Docker. It must prove the full migration chain, the `SOP.processId` foreign key, zero unbackfilled or mismatched `ProcessSopBinding` rows, zero orphan Process references, and nullable `Pengguna.opdId`. After that evidence, review the M11 contract/retirement decision separately; do not delete historical schema or compatibility APIs as part of this iteration.
