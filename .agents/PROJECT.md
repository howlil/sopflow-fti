# SOPFlow Project

This file is the canonical owner for **WHY + WHAT**: product purpose, committed behavior, scope, contracts, ownership semantics, non-goals, and unresolved product questions.

Architecture belongs in `ARCHITECTURE.md`; current milestone state belongs in `CURRENT_ITERATION.md`; implementation conventions belong in `CODE_PATTERNS.md`; verification belongs in `QUALITY.md`; durable rationale belongs in `DECISIONS.md`.

## Purpose

SOPFlow is an SOP lifecycle system for Fakultas Teknologi Informasi (FTI). It supports SOP creation, Process-level review, formal approval, TTE signing, publication, verification, and version lifecycle.

The target product domain is FTI. Legacy Indonesian government/OPD terminology still exists in compatibility code and persisted data, but it is not the target product model.

## Product Model

Core mental model:

```text
Organizational Scope
  -> Process
       -> Process Team
            -> Process Owner + Members
       -> SOP
            -> Process Owner Review
            -> Contextual Final Approval
            -> TTE
            -> Published / Effective Version
```

Do not collapse organizational position, Process relationship, authorship, review, final approval, and platform administration into one role.

## Authorization Dimensions

These dimensions are independent:

```text
Platform Role
  -> SUPER_ADMIN | USER

Process Relationship
  -> PROCESS_OWNER | MEMBER | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

A person may hold capabilities in multiple dimensions. Permission must come from the dimension relevant to the action.

`SUPER_ADMIN` is not a workflow bypass.

## Process

A Process represents one FTI business/operational process.

Committed semantics:

- every Process has one canonical organizational scope: `FACULTY` or `DEPARTMENT`;
- a `DEPARTMENT` Process belongs to a specific department context;
- every Process has exactly one Process Owner;
- every Process has one or more Process Team Members;
- one organizational unit/department may operate multiple Processes;
- Process is not synonymous with organizational unit.

## Process Team

Process Team membership is contextual.

### Process Owner

The Process Owner:

- is accountable for the Process;
- may initiate/author SOP work for that Process;
- receives Process-bound SOP submissions;
- performs Process review;
- may request revision;
- may accept the SOP for final organizational approval.

Process Owner is not a faculty-wide evaluator identity.

### Process Member

A Process Member may initiate and author SOP work for Processes where they are a member, subject to workflow state.

Membership in Process A must not grant access to unrelated Process B.

## Final Approval

There are exactly two current final-approval levels:

```text
FACULTY
  -> DEAN / Dekan

DEPARTMENT
  -> HEAD_OF_DEPARTMENT / Kepala Departemen
```

Units below faculty/department do not introduce another approval tier.

Final authority is derived from Process scope; it is not manually configured as an arbitrary approver on every SOP.

## Canonical SOP Workflow

Target behavior:

```text
Process Owner / Member
  -> create or continue Draft
  -> submit for Process Owner review

Process Owner
  -> request revision
  -> or accept for final approval

Final organizational authority
  -> FACULTY: Dean
  -> DEPARTMENT: relevant Head of Department
  -> approve
  -> contextual TTE
  -> effective/published state
```

Behavioral invariants:

1. authoring permission comes from the relevant Process relationship;
2. Process review belongs to that Process Owner;
3. review may return the SOP for revision;
4. accepted Process review advances toward contextual final approval;
5. final authority is deterministic from organizational scope;
6. TTE signing authority follows the resolved final authority;
7. the product preserves version/publication/audit/legal evidence unless explicitly changed.

Persisted legacy status names may remain during migration when product behavior is already target-native.

## TTE

TTE credential availability and signing authority are separate.

A contextual Dean/Head-of-Department holder must be able to prepare their TTE credentials even when the account still has a legacy global role such as `PENYUSUN`.

Actual signing authority still resolves from the SOP's organizational authority boundary.

## Pelaksana Catalog

`Pelaksana` is the canonical reusable global procedure/swimlane actor catalog, for example `Dosen`, `Mahasiswa`, or `Admin Akademik`.

Committed semantics:

- catalog identity is global to the FTI application;
- Pelaksana is not owned by an OPD, Department, Process, Process Team, or SOP;
- Process relationship determines who may author an SOP, not which Pelaksana rows exist;
- an SOP version selects Pelaksana entries as swimlanes and preserves stable label history for that version;
- a procedure step may reference only an actor selected by that same SOP version;
- exact duplicate catalog identities may be consolidated only when identity is unambiguous;
- legacy `Pelaksana.opdId` is a compatibility shadow, not target ownership semantics.

## Platform Administration

`SUPER_ADMIN` may administer platform concerns such as:

- users/accounts;
- Process definitions and administrative metadata;
- Process Owner/Member assignments;
- organizational authority assignments;
- other explicit configuration required to operate the application.

`SUPER_ADMIN` alone must not automatically:

- author/edit an unrelated Process SOP;
- review as Process Owner;
- approve as Dean/Head of Department;
- sign TTE as an organizational authority;
- force an SOP into an effective state by bypassing workflow.

## Notifications

Target Process workflow events use contextual recipient resolution.

Committed events currently include:

```text
Submit Process SOP
  -> Process Owner

Process Owner accepts
  -> resolved Dean / Head of Department
```

Legacy notification history remains a separate compatibility persistence model. Presentation may combine both sources in the same notification bell.

## Product Experience Direction

Authenticated target navigation/work surfaces should be derived from actual capability:

```text
Process relationship
Organizational authority
Platform administration
```

Target Process-bound users should not need to understand legacy global workflow roles to find normal SOP work.

Legacy routes may remain operable for compatibility, but target-facing vocabulary should use FTI Process/authority semantics.

## Version / Publication / Verification Invariants

Unless explicitly changed, preserve:

- one current effective version behavior;
- controlled replacement/supersession of a previous effective version;
- revocation semantics;
- audit/history evidence;
- TTE evidence;
- official artifact generation;
- public verification of signed/published evidence.

Do not fabricate historical author/reviewer/approver/signing evidence during migration.

## Legacy Compatibility

Legacy concepts such as:

```text
OPD
PENYUSUN
PJ_PENYUSUN
EVALUATOR
PJ_EVALUATOR
KEPALA_OPD
PengajuanEvaluasi
```

remain compatibility/implementation concepts while migration is incomplete.

Committed migration direction:

- target semantics become primary for Process-bound work;
- legacy/unbound behavior remains available where still required;
- historical data is preserved;
- migration is additive/reversible where practical;
- physical cleanup is not required merely to complete semantic/product cutover.

## Current Product Non-Goals

Do not introduce without an explicit new product decision:

- multi-faculty or generic organization SaaS tenancy;
- a centralized evaluator organization/role for target Process review;
- a third final-approval tier for unit heads;
- generic configurable approval-chain engines;
- `SUPER_ADMIN` workflow bypass;
- destructive historical OPD-to-FTI remapping;
- arbitrary per-SOP final approver configuration when authority is derivable from scope;
- a public archive information-architecture redesign.

## Deferred / Transitional Work

The following may remain during the current migration and must not be promoted into immediate scope merely because they exist:

- removal of legacy tables/columns/enums/roles;
- removal of `SOP.opdId` or other compatibility seams;
- broad status/role renaming in persistence;
- destructive normalization of historical data;
- cleanup of legacy routes after compatibility is no longer required.

## Open Product Questions

Treat these as unresolved unless the user establishes them explicitly:

- whether public archive grouping should eventually become Process-first, organizational-scope-first, or preserve the current compatibility IA;
- exact long-term retirement criteria for legacy/unbound workflow routes and persisted role/status concepts;
- whether exceptional administrative repair operations need a dedicated audited product surface.

Do not resolve these questions through implementation inference.