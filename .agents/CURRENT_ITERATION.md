# Current Repository State

This file is the canonical resumable state for ongoing work. Product truth and the committed end state are owned by `PROJECT.md`.

## Target Shape

**Canonical target:** Full FTI.

Normal first-party SOP behavior derives from native FTI semantics:

```text
Platform Role
+ Process Owner eligibility / Process Relationship
+ Organizational Authority
+ Process-owned SOP
```

OPD identity, OPD ownership, and legacy global workflow roles may remain only at explicit historical/external compatibility boundaries.

## Current Position

**Current capability outcome:** Process Owner Self-Service.

The normal target setup/workflow is now:

```text
Admin Platform
  -> setup Faculty / Department
  -> grant Process Owner eligibility in one scope

Authorized Process Owner
  -> create Process in that scope
  -> becomes initial owner automatically
  -> add an existing USER or create one-time onboarding invitation
  -> manage explicit Process membership
  -> archive an unused Process without deleting history

Process Member / Penyusun SOP
  -> activate their own account/password when invited
  -> work only in explicitly assigned Process relationships
  -> continue through the existing Process-native SOP workflow
```

Owner eligibility is a separate authorization axis from `PlatformRole` and `OrganizationalAuthority`; `SUPER_ADMIN` is not an operational Process Owner or workflow bypass merely because it administers the platform.

Process administration changes are append-only audited. Archived Processes are read-only for new authoring/review actions; existing SOP/version/TTE/public/history evidence remains owned by the existing native lifecycle.

The established native Process workflow remains active for:

- Process-bound SOP authoring;
- Process Owner review and revision feedback;
- contextual final approval;
- Process-native TTE and publication/effective transition;
- version replacement;
- contextual revocation;
- Process notifications and reminders;
- Process-first public discovery and verification.

The Process Owner Self-Service change does **not** modify the protected SOP workspace/editor UI, procedure/diagram behavior, or the SOP authoring engine.

## Verification Evidence

The capability package has repository-level evidence from:

- Client CI: build, generated route-tree consistency, typecheck, and unit tests;
- Server CI: Prisma validate/generate, typecheck, and core unit tests;
- FTI Domain CI: owner-scope/self-service tests plus existing Process authoring, review, approval, revocation, notification, and TTE regression tests;
- Migration Smoke: full migration chain, Process database invariants, target E2E seed, and read-only FTI baseline audit;
- Container Build: application images and backend runtime payload build successfully.

Production release/deployment is **not claimed** without separate environment evidence.

## Remaining Material Delta to `PROJECT.md`

Normal first-party Process setup no longer requires Admin to create every Process or membership. Remaining work is primarily compatibility retirement and environment proof rather than another rewrite of the SOP workflow.

Explicit compatibility debt still includes some legacy OPD/global-role DTOs, routes, controllers/services, seed/history structures, and persisted shadows such as `SOP.opdId`, `Pengguna.opdId`, and `ProcessSopBinding`. These may be removed only after their historical/external retention contracts and production data evidence prove they are no longer required.

Do not mechanically delete compatibility schema or rename OPD concepts into Department concepts. Department scope, Process relationship, platform administration, TTE authority, and historical OPD compatibility remain separate dimensions.

## Current Product-Bet State

After Process Owner Self-Service is integrated, do not create another cleanup milestone merely because legacy names still exist. Select the next bet only from a material user or release bottleneck.

Likely next decision boundary:

```text
release / production baseline proof needed?
  -> qualify migrated production-shaped data and deploy safely

first-party capability gap discovered?
  -> fix that user journey

only dead compatibility remains?
  -> retire contracts with evidence, not by search-and-delete
```

Do not turn this file into a milestone archive, sprint ledger, or percentage-progress report.
