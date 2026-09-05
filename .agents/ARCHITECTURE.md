# SOPFlow Architecture

This file is the canonical owner for repository architecture: system boundaries, ownership, flows, and technical invariants. Product semantics belong in `PROJECT.md`; active work belongs in `CURRENT_ITERATION.md`; recurring implementation conventions belong in `CODE_PATTERNS.md`; verification policy belongs in `QUALITY.md`; material rationale belongs in `DECISIONS.md`.

## System Shape

SOPFlow is a TypeScript application with two primary runtime packages:

```text
Browser
  -> client/  (React + TanStack Start/Router/Query)
       -> HTTP API
            -> server/  (NestJS)
                 -> Prisma
                      -> MariaDB
```

Root Compose files provide local/runtime orchestration. The repository is not a generic multi-tenant platform; architecture should remain proportional to the FTI product boundary in `PROJECT.md`.

## Frontend Ownership

Primary boundaries:

```text
client/src/routes
  -> route wiring, guards, route parameters, route composition

client/src/pages
  -> screen/workflow composition

client/src/api
  -> transport-facing API clients and query/mutation entry points

client/src/lib/api
  -> shared API infrastructure

client/src/components/ui
  -> reusable UI primitives

client/src/components + client/src/hooks + client/src/lib
  -> cohesive reusable behavior owned outside a single screen

client/src/stores
  -> genuine shared client state only
```

Server state should remain in TanStack Query where applicable. Do not mirror server state into Zustand without a concrete need.

TanStack Router generated output is tracked in `client/src/routeTree.gen.ts`. Route changes must preserve the repository generator workflow and commit the generated tree when it changes.

The Edit SOP workspace is a protected semantic surface. Read `PROTECTED_SURFACES.md` before any change that could affect its observable layout, editor/workbench composition, controls, autosave flow, copy, or interaction behavior.

## Backend Ownership

Primary boundaries:

```text
server/src/modules
  -> domain/use-case modules

server/src/common
  -> cross-cutting infrastructure with real shared ownership

Controller
  -> HTTP/transport boundary

Service
  -> use-case orchestration, domain policy, contextual authorization, state transitions

Repository
  -> Prisma persistence/query details

server/prisma
  -> persistence schema, migrations, database invariants
```

Keep business policy in the owning service/domain boundary even when part of the rule can be expressed in a Prisma query.

Use transactions for one business atomicity boundary, especially workflow transitions, approval/signing transitions, version activation/replacement, and persistence invariants that can race.

## Canonical Domain Boundaries

Authorization dimensions are independent:

```text
Platform Role
  -> SUPER_ADMIN | USER

Process Relationship
  -> PROCESS_OWNER | MEMBER | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

Do not collapse these into one global role model.

Target workflow ownership:

```text
Process Owner / Member
  -> author Process-bound SOP

Process Owner
  -> process review

Organizational Authority
  -> final approval
       FACULTY    -> DEAN
       DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
  -> contextual TTE
  -> publication/effective-state transition
```

`SUPER_ADMIN` owns administration, not workflow bypass.

## Contextual Resolution

Process access must resolve from the SOP's Process relationship, not from legacy global evaluator/penyusun identity.

Final authority must resolve from organizational scope:

```text
FACULTY
  -> active Dean authority

DEPARTMENT
  -> active Head of Department for that department
```

Credential availability and signing authority are separate concerns. A user may be able to configure TTE credentials because they hold a contextual authority even when their legacy account role is unrelated; actual signing permission still comes from the resolved organizational authority.

## Persistence And Migration Boundary

The target model is Process-oriented, while legacy OPD-era schema/contracts remain transitional compatibility seams.

Current migration strategy is additive and reversible where practical:

- preserve historical evidence;
- preserve required legacy/unbound compatibility;
- avoid destructive remapping merely to normalize names;
- prefer explicit adapters/bindings over scattering legacy semantics into new target-domain code;
- treat successfully applied shared migrations as immutable by default;
- add a later corrective migration instead of rewriting shared migration history.

`server/prisma/DB-INVARIANTS.md` remains the detailed database-invariant companion and must stay aligned when persistence invariants change.

Native Process Owner review decisions are persisted as append-only `ProcessReview` evidence. The row records the explicit DetailSOP, SOP, Process, reviewer, decision, optional review note, and status transition, and is created in the same transaction as the status CAS, edit log, and native notification. This is the active review source of truth; the former evaluation-value/history capability is retired and its tables are archived by forward migration.

New native `ProcessFinalApproval` evidence links to the accepted `ProcessReview` through nullable `processReviewId`. The nullable expand-phase link preserves historical native approvals whose originating review evidence predates `ProcessReview`; the application populates it for new approvals when the accepted review is available.

Native revision feedback uses the existing `ProcessNotification` persistence path: an optional `ProcessReview.catatan` is copied into the durable author notification body and a bounded preview. This keeps review evidence owned by `ProcessReview` while allowing the existing notification consumer to display feedback without coupling native Process work back to legacy evaluation/reminder tables.

The target uses Process Owner review and contextual authority instead of a centralized evaluator role. Native review evidence is therefore `ProcessReview` plus the existing Process status lifecycle. Legacy per-detail scoring, follow-up, completion/rejection, and BA/reporting are retired from the active product; historical rows are retained only in explicitly archived tables.

## Full FTI Cutover Architecture

The long-term architecture is **native FTI**, not a permanent FTI facade over an OPD core.

Canonical ownership direction:

```text
User
  -> Platform Role
  -> Process Relationship
  -> Organizational Authority

Process
  -> organizational scope
  -> SOP
```

Legacy concepts may remain physically present during migration, but they must progressively lose semantic authority over target behavior.

Use this cutover sequence for material legacy retirement:

```text
EXPAND
  -> introduce native FTI ownership/contracts

BACKFILL
  -> populate native relationships from authoritative existing evidence

CUTOVER
  -> move first-party reads/writes/authorization to native FTI sources

PROVE
  -> verify completeness, workflow/evidence integrity, and zero first-party legacy dependency

CONTRACT
  -> remove obsolete legacy schema/contracts/adapters
```

Architecture rules:

- do not mechanically rename `opdId` to `departmentId`; Department context and Process relationship are different domain dimensions;
- `ProcessSopBinding`, `SOP.opdId`, `Pengguna.opdId`, legacy role checks, and OPD-oriented first-party routes/APIs are transitional seams only where still required;
- target services must not introduce new OPD/global-role dependencies except inside an explicit compatibility adapter;
- avoid indefinite dual-write, dual-ownership, or dual-authority paths; each compatibility path needs a concrete retention reason and eventual retirement condition;
- semantic cutover happens before destructive physical cleanup;
- historical audit/TTE/version/publication evidence must remain intact through cutover;
- applied shared migration history remains immutable by default; use forward corrective migrations;
- legacy evaluation behavior that is not a target FTI capability should be isolated as historical/compatibility behavior rather than mechanically recreated as a new FTI role model.

The architecture reaches Full FTI only when active first-party authoring, review, approval, TTE, notification, versioning, publication, revocation, and public discovery operate without OPD/global-role fallback. Remaining OPD references may exist only in immutable history or explicit external/historical compatibility adapters.

## Notification Boundary

Process workflow notifications use target-native persistence. Legacy evaluation/reminder notification tables are archived and are not composed into the active notification bell.

Runtime ownership follows the persistence boundary:

```text
ProcessNotificationModule
  -> ProcessNotificationController
  -> ProcessNotificationService
  -> ProcessNotification persistence
  -> ProcessReminderService
       -> ProcessReminder mutable retry/lock state

NotificationEventsModule
  -> shared post-commit event stream used by Process notifications
```

Native Process authoring and Process TTE modules import `ProcessNotificationModule`; they must not import the retired legacy notification module. `ProcessReminderService` maps `PROCESS_OWNER_REVIEW_REQUESTED`, `PROCESS_REVISION_REQUESTED`, and `FINAL_APPROVAL_REQUESTED` to the current native recipient and replaces the active reminder set for that DetailSOP version transactionally. A successful `PROCESS_SOP_EFFECTIVE` or `PROCESS_SOP_REVOKED` event clears the active native reminder state. The mutable state preserves retry/lock/destination semantics without copying legacy roles or OPD ownership.

## TTE / PDF Boundary

TTE and signed PDF behavior is security/legal-evidence-sensitive. Keep these concerns explicit:

- credential ownership and storage;
- authority resolution;
- signing transaction/state transition;
- persisted signing evidence;
- published artifact generation;
- public verification path;
- effective-version integrity.

Native Process TTE artifacts use the shared `DokumenTte` storage with nullable `processId` as an explicit ownership marker. Historical `pengajuanEvaluasiId` artifacts remain untouched for legal retention. Process TTE rejects an explicit legacy-parent ownership mismatch.

Public TTE verification treats a document as native Process evidence only when its detail parent and `processId` marker are both present. The native approval lookup matches both identifiers and signer; historical detail artifacts without the marker remain verifiable without being assigned native Process authority metadata.

The legacy `PengajuanEvaluasi`-backed TTE workflows are retired from runtime. The shared repository exposes only native/shared credential, public verification, and PDF concerns; historical TTE rows remain in the database for retention.

Do not infer end-to-end signing correctness from unit-level service behavior alone.

## Legacy Compatibility Boundary

Legacy concepts such as `OPD`, `PENYUSUN`, `PJ_PENYUSUN`, `EVALUATOR`, `PJ_EVALUATOR`, and `KEPALA_OPD` remain implementation/compatibility evidence, not target product concepts.

Target-facing architecture should not introduce new dependencies on those concepts unless the change is explicitly a compatibility adapter. Legacy routes may remain operable while target Process/authority surfaces become primary.

Compatibility is not a second target architecture. Once a target path has cut over and its retention requirements are satisfied, its legacy dependency should be retired rather than propagated forward.

The former evaluation and WhatsApp reminder capability has no active endpoint ownership. Its legacy tables are renamed to `_retired_*` archive tables by migration `20260906120000_retire_legacy_evaluation_and_whatsapp`; `PengajuanEvaluasi` and its BA parent remain historical compatibility data only. The active endpoint surface is Process review, Process notification/reminder, contextual approval, native TTE, publication, revocation, and public discovery.

## Architecture Change Threshold

A change is material and requires explicit user direction when it changes any of these:

- service/module ownership boundary;
- public API/contract semantics;
- data ownership or canonical source of truth;
- authorization/security boundary;
- workflow approval authority;
- consistency/transaction model;
- infrastructure/runtime topology;
- destructive migration strategy.

Routine implementation choices inside these boundaries remain agent-owned.
