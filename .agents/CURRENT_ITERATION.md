# Current Iteration

Iteration: Sprint 3 — Process-Owned SOP Authoring
Delivery State: IMPLEMENTED_AWAITING_VERIFICATION
Branch: `feat/process-owned-sop-authoring`
Created: 2026-09-01

## Feature Shape

Sprint 3 moves the first SOP authoring path from legacy OPD/global-role ownership toward contextual Process ownership without migrating review, final approval, or TTE.

Implemented target path:

```text
Process Owner / Process Member
-> sees assigned Processes
-> selects Process
-> creates SOP
-> SOP is bound to Process
-> list/workbench/header authorization uses Process relationship
```

Compatibility path remains for legacy SOPs and later workflow stages.

## Current Position

`VERIFY -> QUALITY GATES`

## Evidence Present

- current-user Process context exists without a global `PROCESS_OWNER` role;
- additive `ProcessSopBinding` associates new target-path SOPs with a Process;
- target SOP create/list/workbench/header authorization uses Process Owner/Member relationship;
- Process-bound SOPs do not remain authorable merely because another user shares the legacy OPD;
- client create/list flow consumes the Process contract and requires Process selection;
- Process-assigned users can discover the target SOP authoring surface without granting access to unrelated legacy Penyusun pages;
- transitional Process-bound SOP guard protects legacy SOP mutation routes for Process-bound documents;
- public SOP routes remain outside that guard;
- Prisma validate/generate and server typecheck passed in CI on the Sprint 3 line;
- an observed core-unit run executed 523 passing assertions; two legacy fixtures initially failed TypeScript compilation because Sprint 2 added required `platformRole`, and those fixtures were corrected with minimal `PlatformRole.USER` deltas;
- focused Process/authoring authorization tests exist;
- integration/E2E were intentionally not made default gates.

## Remaining Before Sprint 3 Can Close

- observe final Server CI and Client CI after the latest authorization hardening;
- ensure `process-bound-sop.guard.spec.ts` is included in the focused CI command;
- update database invariant documentation for `ProcessSopBinding` and Process-owned authoring;
- inspect migration SQL and run one targeted migration/invariant rehearsal only if the persistence invariant cannot be proven by schema/unit evidence;
- final diff/self-review and exact verification report.

Do not merge, release, or deploy merely because implementation exists.

## Resolved Blocker For Next Procedure Slice

Legacy `Pelaksana` is currently OPD-owned and therefore duplicates the same procedure actor vocabulary across organizational boundaries.

The target product decision is:

```text
Pelaksana = global reusable procedure-actor catalog
```

It is not owned by OPD, Department, Process, Faculty, or a Process Team.

Examples such as `Dosen`, `Mahasiswa`, `Admin Akademik`, `Kepala Departemen`, and `Dekan` should be reusable by any SOP that needs that procedure actor.

Usage context belongs to the SOP/version, not to the global catalog row.

New catalog mutations must retain attribution:

```text
createdById
createdAt
updatedById
updatedAt
```

Any active authenticated user may create or edit catalog entries; this permission must not be tied to `SUPER_ADMIN`, a legacy global role, Department, or Process ownership.

Historical/versioned SOP rendering must not change retroactively when a global catalog label is edited. SOP usage therefore requires a stable snapshot of the displayed actor label at the document-version boundary.

---

# Planned Next Iteration

Iteration: Sprint 4 — Global Pelaksana Catalog & Process-Native Procedure Authoring
Status: PLANNED_NEXT

Sprint 4 becomes active after Sprint 3 verification closes.

## Sprint Goal

Remove OPD ownership from the target Pelaksana semantics and make procedure actors globally reusable, auditable, and safe for versioned SOP documents, while completing the Process-owned procedure-authoring path end to end.

Success means:

```text
active authenticated user
-> can create/reuse/edit global Pelaksana catalog entries
-> creator/editor attribution is visible and persisted

Process Owner / Member
-> opens Process-owned SOP draft
-> selects reusable Pelaksana for that SOP version
-> builds swimlanes / procedure steps
-> another Department or Process can reuse the same Pelaksana catalog row
-> editing the global label later does not rewrite historical SOP wording
```

## Product And Data Rules

Canonical target semantics for this sprint:

1. `Pelaksana` is global reusable procedure vocabulary.
2. `Pelaksana` has no target ownership by OPD, Department, Faculty, Process, or Process Team.
3. Any active authenticated user may create or edit Pelaksana catalog entries.
4. Catalog mutations persist creator and latest-editor attribution plus timestamps.
5. SOP/version usage stores a stable actor-label snapshot; global catalog edits do not retroactively mutate historical/versioned SOP content.
6. A procedure step may use only a Pelaksana selected into that same SOP version's swimlane/context.
7. Existing legacy OPD data must be migrated without fabricating creator/editor history.
8. Existing duplicate labels across OPDs should be consolidated only when identity is unambiguous; ambiguous near-duplicates must be surfaced rather than silently merged.
9. Deletion policy is not expanded in this sprint. Do not introduce unrestricted deletion of catalog rows that are referenced by SOP history.

## Delivery Strategy

Use:

`Expand -> Contract -> Client Consume -> Migrate References -> Cut Over -> Verify`

Do not perform a backend-only rewrite first.

For each slice:

```text
small server/schema seam
-> focused unit/schema evidence
-> client immediately consumes it
-> next seam
```

Server should remain at most one small contract ahead of the client.

## Planned Vertical Slices

### Slice A — Global Catalog Contract + Audit Attribution

Goal: expose target Pelaksana semantics without first deleting legacy OPD fields.

Server/schema:

- expand the current persistence model or introduce the smallest reversible compatibility representation needed for global semantics;
- persist `createdById`, `updatedById`, `createdAt`, `updatedAt` for new catalog mutations;
- legacy rows with unknowable historical creator/editor must remain explicitly unknown/null during backfill rather than fabricating an actor;
- list/create/edit authorization requires an active authenticated user, not a special workflow/platform role;
- do not drop legacy `opdId` in the first step merely to make the schema look clean.

Client immediately follows:

- Pelaksana catalog becomes a global reusable list rather than OPD-filtered list;
- create/edit is available to authenticated users who reach the procedure-authoring context;
- show creator/latest-editor attribution where useful without turning the UI into an audit dashboard.

Exit evidence:

```text
Dept A user creates "Dosen"
Dept B user can reuse "Dosen"
Dept B does not need a duplicate row
SUPER_ADMIN is not required
creator/editor attribution persists
```

### Slice B — SOP-Version Usage Snapshot

Goal: separate mutable global catalog identity from immutable/versioned SOP wording.

Target behavior:

```text
Global Pelaksana
  nama = "Dosen Pengampu"

DetailSOP version 1 usage snapshot
  nama = "Dosen"
```

Server/schema:

- add the smallest snapshot field/representation at the SOP-version swimlane boundary;
- when a Pelaksana is selected for a DetailSOP, copy the current display label into the version usage record;
- rendering existing SOP versions uses the snapshot, not the mutable current catalog label;
- backfill existing usage snapshots from the label that exists at migration time.

Client immediately follows:

- procedure editor selects from the global catalog;
- selected swimlanes render from the SOP-version usage context;
- editing catalog metadata does not silently rename already-bound SOP versions.

### Slice C — Process-Native Procedure Authorization

Goal: finish the part Sprint 3 could not safely migrate because of the same-OPD Pelaksana invariant.

Server:

- Process Owner/Member authorization controls procedure/diagram draft mutations for Process-bound SOPs;
- remove the target-path assumption that selected Pelaksana must share `SOP.opdId`;
- constrain `LangkahSOP` actor usage to a Pelaksana selected into the same `DetailSOP` swimlane/context;
- preserve status/editability and branch-integrity invariants;
- legacy unbound SOPs may continue through compatibility behavior until contract cleanup.

Client immediately follows:

- existing procedure editor is reused;
- actor picker uses global Pelaksana catalog;
- Process member from a different legacy OPD can still author the Process-owned SOP when the Process relationship allows it;
- no duplicate editor is introduced.

Exit evidence:

```text
Process A member -> edit Process A procedure
same actor "Dosen" -> reusable by Process B
same-OPD unrelated user -> denied
selected actor not in this DetailSOP -> rejected
```

### Slice D — Legacy Data Consolidation + Cutover Proof

Goal: remove the legacy OPD ownership constraint from the proven target path without a blind destructive rewrite.

Migration work:

- inventory current Pelaksana labels and references before consolidation;
- identify exact/unambiguous duplicates across OPDs;
- redirect DetailSOP/swimlane/step references to one canonical global actor when identity is unambiguous;
- preserve all SOP-version snapshots;
- retire the same-OPD trigger/validation only after the target relation/invariant is in place;
- keep any physical legacy ownership column as nullable/deprecated compatibility data if dropping it would increase migration risk; physical cleanup can happen in a later contract sprint.

Do not silently merge ambiguous labels that merely look similar.

Cutover proof:

```text
one global actor identity
-> reusable across Process/Department/Faculty SOPs
-> historical SOP labels stable
-> current Process authorization controls editing
-> no OPD-based actor-ownership requirement on the target path
```

## Verification Strategy

Default fast gates remain lean.

Server:

- Prisma validate/generate;
- typecheck;
- focused Pelaksana catalog/audit/snapshot authorization unit tests;
- focused Process procedure authorization tests;
- lean Server CI.

Client:

- typecheck;
- build/route generation;
- focused catalog/procedure component tests where useful;
- lean Client CI.

Escalate only where migration risk justifies it:

- run one targeted MariaDB migration rehearsal because this sprint changes existing relational constraints/references;
- verify duplicate consolidation and snapshot backfill using migration-specific assertions;
- do not run the full integration suite by default;
- do not add broad Playwright/E2E by default;
- use at most one targeted browser journey only if build/component evidence cannot prove the procedure interaction boundary.

## Explicit Non-Goals

Do not in Sprint 4:

- migrate Process Owner review/evaluator semantics;
- change submit/review status behavior;
- change Dean/Kadep final approval;
- change TTE authority/signing;
- migrate public archive grouping;
- add generic RBAC/ABAC or workflow engines;
- build a full audit-history/revision subsystem for Pelaksana unless later required; creator/latest-editor attribution is sufficient for this sprint;
- invent a delete/merge administration feature for catalog entries;
- drop legacy OPD columns before target references and migration evidence are proven;
- make integration/E2E mandatory for ordinary commits.

## Stop Conditions

Stop and surface if:

- duplicate Pelaksana records cannot be consolidated without ambiguous semantic choices;
- preserving historical SOP wording requires rewriting signed/effective document history;
- migration requires destructive reference loss;
- Process-native procedure editing requires changing review/approval/TTE semantics;
- the only solution requires making Pelaksana owned by Department/Process again;
- a public/API compatibility break cannot be made additive.

## Expected Next Sprint After Sprint 4

Sprint 5 — Process Owner Review

```text
Process Owner / Member
-> submit Process-owned SOP
-> Process Owner review
   -> revision
   -> accepted / ready for final approval
```

The previous roadmap placed Process Owner Review in Sprint 4. It moves to Sprint 5 because procedure authoring must first be free of the legacy OPD-owned Pelaksana constraint; otherwise the review slice would build on an incorrect ownership boundary.

## Tracking Rules

- Sprint 3 remains active until its verification closes.
- Sprint 4 is planned next and must not be reported as implemented yet.
- Keep work oriented around `Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`.
- Do not merge, release, or deploy without explicit authorization and evidence.