# Current Repository State

This file is the canonical resumable state for ongoing work. Product truth and the committed end state are owned by `PROJECT.md`.

## Target Shape

**Canonical target:** Full FTI.

Normal first-party SOP behavior derives only from native FTI semantics:

```text
Platform Role
+ Process Owner eligibility / Process Relationship
+ Organizational Authority
+ Process-owned SOP
```

Legacy OPD identity, legacy global workflow roles, and evaluation-era records are not first-party authorization, ownership, routing, discovery, or workflow inputs. Historical evidence may remain only in explicitly retained persistence/read boundaries.

## Current Position

**Current capability outcome:** Full FTI first-party runtime with legacy runtime retired.

The normal setup/workflow is:

```text
Admin Platform
  -> setup Faculty / Department
  -> grant Process Owner eligibility in one scope

Authorized Process Owner
  -> create Process in that scope
  -> becomes initial owner automatically
  -> add existing USER or issue one-time onboarding invitation
  -> manage explicit Process membership

Process Member / Penyusun SOP
  -> work through Process-owned SOP authoring
  -> submit to Process Owner review
  -> contextual final approval by Dean / Head of Department
  -> Process-native TTE
  -> effective / version / revoke lifecycle
```

The first-party runtime no longer mounts or exposes legacy OPD, Evaluator, Kepala OPD, Penyusun administration controllers/services, legacy SOP authorization/version fallback, or global-role guards. Access JWT runtime identity is role-free; target authorization comes from the native axes above.

Public archive discovery is Process-first only. SOP rows without `processId` are historical compatibility records and cannot re-enter live authoring/version/revocation/public-discovery flows.

## Historical Retention Boundary

Historical data is retained without keeping legacy workflow runtime alive:

- unbound SOPs are classified into explicit `LegacySopRetention` snapshots;
- historical OPD/evaluation/TTE evidence may remain where needed for provenance and verification;
- `SOP.opdId` and `Pengguna.opdId` remain nullable historical persistence shadows until a separate data-retention proof justifies physical removal;
- active `ProcessSopBinding` is retired from the Prisma contract and renamed to `_retired_ProcessSopBinding_20260906` as reversible migration evidence rather than destructively dropped.

Do not use retained legacy fields/tables to authorize target operations or reconstruct first-party ownership.

## Verification Evidence

The Full FTI exit package is qualified by executable repository gates:

- **Full FTI Runtime Audit** — fails if legacy controllers, role guards, client OPD contracts, JWT role hydration, or SOP legacy fallback return to first-party source;
- **Server CI** — Prisma validate/generate, typecheck, and core unit regression suite;
- **Client CI** — build, generated route consistency, typecheck, and unit tests;
- **FTI Domain CI** — Process authoring/review/approval/revocation/TTE/notification domain regression;
- **Migration Smoke** — complete migration chain, Process/TTE/reminder invariants, retention backfill, Full FTI DB audit, reversible `ProcessSopBinding` retirement rehearsal, and post-rollback audit;
- **Container Build** — deployable application images build from the same release candidate.

The protected SOP workspace/editor UI and its procedure/diagram authoring behavior are not redesigned by this retirement milestone.

Production release/deployment and production-database proof are **not claimed** without separate environment evidence.

## Remaining Material Delta to `PROJECT.md`

There is no remaining known first-party OPD/global-role workflow dependency by design. Remaining legacy structures are historical persistence/verification concerns, not reasons to restore compatibility runtime.

The next work should be selected only from a material product or release bottleneck:

```text
production baseline proof needed?
  -> run the read-only Full FTI audit/backfill qualification against the target environment

first-party capability gap discovered?
  -> fix that user journey

historical storage contract proven removable?
  -> remove only the specifically proven dead persistence contract
```

Do not mechanically rename OPD history into Department history, fabricate Process ownership for historical rows, or delete retained evidence without an explicit retention/data proof.
