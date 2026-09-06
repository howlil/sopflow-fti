# Current Repository State

This file is the canonical resumable state for ongoing work. Product truth and the committed end state are owned by `PROJECT.md`.

## Target Shape

**Canonical target:** Full FTI.

Normal first-party identity and SOP behavior derives from native FTI semantics:

```text
Platform Role
+ Process Owner eligibility / Process Relationship
+ Organizational Authority
+ Process-owned SOP
```

Legacy OPD identity and global workflow-role values may survive only as historical persistence evidence. They are not valid first-party authorization inputs.

## Current Position

**Current capability outcome:** Full FTI first-party runtime with legacy runtime retired.

The normal setup/workflow is Process-native from platform administration through authoring, Process Owner review, contextual Dean/Head of Department approval, TTE, publication, versioning, and revocation.

The current identity-retirement iteration removes the remaining active account semantics from legacy identity shadows:

- native platform-account creation does not fabricate `Pengguna.opdId` or `Pengguna.peran`;
- Process invitation onboarding creates the same identity-native `USER` shape;
- authentication reads only identity/session/platform-role fields and never hydrates OPD/global workflow role;
- current-user TTE profile/credential setup reads identity fields only;
- `Pengguna.peran` and `Pengguna.opdId` are nullable historical shadows for pre-FTI rows, not active account semantics;
- legacy PJ Evaluator singleton triggers are retired because no first-party account flow assigns that role;
- `RiwayatTandaTangan.peran` remains required immutable signing evidence and is intentionally not converted into current account authority.

Existing historical rows are not rewritten or deleted merely to make the schema look cleaner.

## Historical Retention Boundary

Historical data is retained without keeping legacy workflow runtime alive:

- unbound SOPs are classified into explicit `LegacySopRetention` snapshots;
- historical OPD/evaluation/TTE evidence may remain where needed for provenance and verification;
- `SOP.opdId`, `Pengguna.opdId`, and non-null legacy values in `Pengguna.peran` may remain on historical rows until separate retention proof justifies physical removal;
- active `ProcessSopBinding` is retired from the Prisma contract and retained as `_retired_ProcessSopBinding_20260906` for reversible migration evidence.

Do not use retained legacy fields/tables to authorize target operations or reconstruct first-party ownership.

## Verification Boundary

Before this iteration may merge, exact-head CI must prove:

- Prisma schema validates/generates with nullable current-account legacy role;
- Server typecheck/core unit tests pass, including auth, platform-account, and current TTE identity boundaries;
- FTI Domain CI preserves Process-native workflow behavior;
- Migration Smoke applies the complete migration chain without data loss;
- Full FTI Exit verifies source-level zero dependency plus nullable identity-shadow database invariants;
- Client CI and container builds remain green;
- protected SOP workspace/editor/procedure/diagram production surfaces remain untouched.

Production release/deployment and production-database cleanup are **not** claimed without separate environment evidence.

## Remaining Material Delta to `PROJECT.md`

After identity-shadow retirement, surviving legacy structures are expected to be historical data contracts rather than active identity/workflow dependencies. Important examples include:

- historical `OPD`, `RiwayatOpdPengguna`, and `OPDPeraturan` rows;
- historical/unbound SOP provenance captured through `LegacySopRetention` and nullable `SOP.opdId`;
- historical `PengajuanEvaluasi` and retired evaluation/notification tables;
- signing role snapshots in `RiwayatTandaTangan.peran`;
- `_retired_ProcessSopBinding_20260906` migration evidence.

Do not physically drop these merely because first-party runtime no longer consumes them. Future contraction requires production-shaped data evidence plus explicit retention/rollback proof.

## Current Product-Bet State

After this identity iteration is integrated, do not create another cleanup milestone merely to eliminate legacy words from migration/history files. Select the next action from a material release or product bottleneck:

```text
production migration/deploy proof needed?
  -> qualify the real environment and retained historical rows

first-party capability gap discovered?
  -> fix that user journey

only historical persistence remains?
  -> contract only structures proven unnecessary for retention
```

The protected SOP workspace/editor UI and procedure/diagram engine remain outside this cleanup.
