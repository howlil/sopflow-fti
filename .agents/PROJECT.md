# SOPFlow Project

This file is the canonical owner for **WHY + WHAT**: product purpose, committed behavior, scope, contracts, ownership semantics, non-goals, and unresolved product questions.

Architecture belongs in `ARCHITECTURE.md`; current milestone state belongs in `CURRENT_ITERATION.md`; implementation conventions belong in `CODE_PATTERNS.md`; verification belongs in `QUALITY.md`; durable rationale belongs in `DECISIONS.md`.

## Purpose

SOPFlow is an SOP lifecycle system for Fakultas Teknologi Informasi (FTI). It supports SOP creation, Process-level review, formal approval, TTE signing, publication, verification, revocation, and version lifecycle.

The target product domain is FTI. Legacy Indonesian government/OPD terminology still exists in compatibility code and persisted data, but it is not the target product model.

The committed end state is **Full FTI**: active FTI product behavior must not depend on OPD identity, OPD ownership, or legacy global workflow roles. Legacy concepts may survive only as explicit migration/historical compatibility boundaries until their contracts are safely retired.

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
            -> Contextual Revocation
```

Do not collapse organizational position, Process relationship, authorship, review, final approval, revocation, and platform administration into one role.

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

## Revocation

Process-bound SOP revocation uses the same resolved organizational authority boundary as final approval:

```text
FACULTY
  -> active DEAN / Dekan

DEPARTMENT
  -> active HEAD_OF_DEPARTMENT / Kepala Departemen for that Department
```

Committed semantics:

- only a currently `BERLAKU` version may be revoked;
- a revision in flight blocks revocation until the version lifecycle is no longer ambiguous;
- Process Owner, Process Member, and `SUPER_ADMIN` do not gain revocation authority from those capabilities alone;
- successful revocation transitions the effective version to `DICABUT`;
- revocation removes current/effective/public availability but preserves version history, approval evidence, TTE evidence, signed artifact history, and audit evidence;
- revocation does not automatically create a new draft/replacement version;
- legacy/unbound SOP may keep compatibility revocation behavior until that path is explicitly retired.

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
  -> optionally revoke an effective SOP in the same authority scope
```

Behavioral invariants:

1. authoring permission comes from the relevant Process relationship;
2. Process review belongs to that Process Owner;
3. review may return the SOP for revision;
4. accepted Process review advances toward contextual final approval;
5. final authority is deterministic from organizational scope;
6. TTE signing authority follows the resolved final authority;
7. revocation authority follows the same resolved organizational authority for Process-bound SOPs;
8. the product preserves version/publication/audit/legal evidence unless explicitly changed.

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
- revoke an SOP as an organizational authority;
- force an SOP into an effective state by bypassing workflow.

## Notifications

Target Process workflow events use contextual recipient resolution and target-native Process notification persistence.

Committed events currently include:

```text
Submit Process SOP
  -> Process Owner

Process Owner accepts
  -> resolved Dean / Head of Department

Process Owner requests revision
  -> original Process-bound author

Contextual TTE completes and SOP becomes BERLAKU
  -> original Process-bound author
  -> Process Owner

Contextual authority revokes an effective SOP
  -> original Process-bound author
  -> Process Owner
```

Committed feedback semantics:

- revision feedback is created in the same business transaction as the Process Owner revision transition;
- effective-state feedback is created only when contextual TTE finalization successfully makes the version `BERLAKU`, not merely when final approval is recorded;
- revocation feedback is created in the same business transaction as `BERLAKU -> DICABUT` and official-artifact revocation;
- when the same account is both original author and Process Owner, that account receives one notification for the event rather than duplicates;
- feedback recipients come from Process/authorship evidence, not legacy global workflow roles;
- target feedback actions use existing FTI-native work surfaces rather than new legacy-role routes;
- realtime refresh may be emitted after commit, but notification persistence must not be orphaned from the business transition that caused it.

Legacy notification history remains a separate compatibility persistence model. Presentation may combine both sources in the same notification bell, but M9 does not merge their persistence/history.

## Public Archive & Discovery

The normal public archive for the target FTI product is Process-first.

Target discovery model:

```text
FACULTY / DEPARTMENT scope
  -> Process
       -> current published SOP
            -> official published PDF
```

Committed semantics:

- `SOP.processId` is the native authoritative ownership/classification for Process-bound SOPs in target public discovery; `ProcessSopBinding` remains only as migration/backfill evidence and explicit compatibility boundary;
- a Process-bound SOP is public only when the relevant version is `BERLAKU` and has an official `PUBLISHED` PDF artifact;
- faculty Processes and department Processes are discoverable from their persisted organizational scope; department context is shown for `DEPARTMENT` Processes;
- selecting a Process returns only the current published SOPs bound to that Process;
- global public search may match SOP title, SOP number, Process name, and Department name;
- target global search must not duplicate a Process-bound SOP through its legacy `SOP.opdId` compatibility shadow;
- legacy/unbound published SOPs may remain discoverable through an explicit compatibility fallback while migration is incomplete;
- public preview/open actions reuse the existing official PDF endpoint and therefore inherit its current-state checks;
- contextual revocation removes a Process-bound SOP from current target discovery and official public PDF availability while preserving historical evidence;
- legacy OPD-based public endpoints remain compatibility APIs and are not silently repurposed as target Process APIs.

Additive target endpoints:

```text
GET /sop/public/fti/processes
GET /sop/public/fti/processes/:processId/sop
GET /sop/public/fti/sop
```

Normal `/arsip` navigation should expose FTI Process/scope terminology rather than requiring visitors to understand OPD-era ownership.

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
- contextual revocation semantics;
- audit/history evidence;
- TTE evidence;
- official artifact generation;
- public verification of signed/published evidence.

A revoked version is historical evidence, not a current effective/public SOP.

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
- legacy/unbound behavior remains available only where a concrete compatibility or historical requirement still exists;
- historical data and legal/audit evidence are preserved;
- migration is additive/reversible where practical;
- compatibility adapters must remain explicit rather than leaking legacy ownership/authorization back into target-domain code;
- physical cleanup follows proven semantic cutover rather than preceding it.

Compatibility is temporary architecture, not an alternate long-term product model.

## Full FTI End State

**Full FTI** means active first-party product behavior no longer depends on OPD identity, OPD ownership, or legacy global workflow roles.

Target state:

```text
User
  -> Platform Role
  -> Process Membership / Ownership
  -> Organizational Authority

Process
  -> organizational scope
  -> SOP
       -> Process review
       -> contextual approval
       -> contextual TTE
       -> publication / revocation
```

Active FTI runtime must eventually satisfy all of these:

- SOP ownership is directly canonical to `Process`; `SOP.opdId` and `ProcessSopBinding` are not active ownership/classification dependencies;
- account/workflow authorization does not require `Pengguna.opdId` or legacy `PeranPengguna` semantics;
- `OPD`, `RiwayatOpdPengguna`, `OPDPeraturan`, OPD-scoped Pelaksana compatibility fields, and similar legacy structures do not own target behavior;
- target TTE, notifications, public discovery, authoring, review, approval, versioning, and revocation resolve exclusively from FTI Process/authority semantics;
- first-party client routes, DTOs, query keys, API clients, and navigation do not require OPD identifiers for normal target workflows;
- legacy OPD routes/APIs may survive temporarily only as explicit compatibility adapters with no first-party target dependency;
- legacy evaluation/global-role workflows are either migrated to a justified FTI-native capability or isolated as historical/compatibility behavior; they must not silently remain a second target workflow model.

Retirement targets include, when no longer required by concrete compatibility contracts:

```text
SOP.opdId
Pengguna.opdId
ProcessSopBinding
RiwayatOpdPengguna
OPDPeraturan
OPD-owned target behavior
legacy global workflow-role authorization
legacy OPD first-party routes / DTOs / API clients
legacy public OPD contracts after their compatibility window closes
```

Do not mechanically replace `opdId` with `departmentId`. Department membership/identity must only exist when the FTI product actually requires it; Process relationship and organizational authority remain separate capability dimensions.

## Full FTI Migration Strategy

Use a staged migration rather than a giant rename/rewrite:

```text
EXPAND
  -> add native FTI ownership/contracts without removing legacy compatibility

BACKFILL
  -> populate native FTI relationships from authoritative existing evidence

CUTOVER
  -> make first-party reads/writes/authorization use native FTI sources only

PROVE
  -> verify data completeness, workflow integrity, legal/audit evidence, and zero first-party legacy dependency

CONTRACT
  -> retire obsolete legacy columns/tables/enums/routes/adapters only after the cutover is proven
```

Rules:

- each step must preserve current valid historical evidence;
- migration history already applied to shared environments is not rewritten casually;
- do not maintain indefinite dual-write/dual-authority paths; compatibility must have a concrete reason and retirement condition;
- cut over ownership/authorization before destructive physical cleanup;
- a compatibility field may remain physically present after semantic cutover, but it must not remain a hidden source of truth;
- remove legacy structures only after no target first-party behavior depends on them and required historical/compatibility reads are covered.

## Full FTI Exit Criteria

The repository may claim **FULL_FTI / LEGACY_RETIRED** only when all are true:

1. every active target SOP is canonically owned/classified by native FTI Process data without OPD fallback;
2. all target authorization decisions derive from Platform Role, Process Relationship, and Organizational Authority only;
3. first-party target UI/API paths contain no required OPD routing or ownership context;
4. target TTE, notification, publication, revocation, version, and public-discovery flows operate without OPD/global-role fallback;
5. migration/backfill completeness has been verified against persisted data;
6. historical audit/TTE/version/publication evidence remains intact;
7. any surviving OPD code/data is isolated to explicitly documented historical or external compatibility adapters;
8. obsolete legacy structures/contracts have either been removed or have a named external retention requirement and no active target dependency.

A repository-wide `OPD`/legacy-role search may still find immutable migration history, historical evidence names, or explicit compatibility adapters. It must not find those concepts acting as the source of truth for normal FTI product behavior.

## Current Product Non-Goals

Do not introduce without an explicit new product decision:

- multi-faculty or generic organization SaaS tenancy;
- a centralized evaluator organization/role for target Process review;
- a third final-approval tier for unit heads;
- generic configurable approval-chain or revocation-chain engines;
- `SUPER_ADMIN` workflow bypass;
- destructive historical OPD-to-FTI remapping;
- arbitrary per-SOP final approver configuration when authority is derivable from scope;
- a second parallel public archive taxonomy independent of Process ownership;
- bulk/scheduled revocation or a second revocation-approval workflow.

## Deferred / Transitional Work

The following remain implementation work until an explicit milestone activates them; their existence does not authorize autonomous cleanup:

- contract cleanup/retirement of `ProcessSopBinding` / `SOP.opdId` after compatibility evidence and external contracts permit it;
- continued isolation of `Pengguna.opdId` and legacy global roles from native target authorization;
- retirement or FTI-native replacement of remaining OPD-owned supporting-domain behavior;
- isolation/retirement of legacy evaluation workflows that are not part of the target FTI product;
- removal of legacy first-party routes, DTOs, API clients, tables, columns, enums, and compatibility APIs after exit criteria are met;
- physical normalization of persisted historical names only when it has concrete value and preserves evidence.

## Open Product Questions

Treat these as unresolved unless the user establishes them explicitly:

- whether any external consumer requires a long-lived OPD compatibility API after first-party Full FTI cutover;
- whether exceptional administrative repair operations need a dedicated audited product surface.

Do not resolve these questions through implementation inference.
