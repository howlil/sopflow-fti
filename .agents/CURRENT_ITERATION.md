# Current Iteration

Iteration: Sprint 2 — FTI Process Ownership Foundation
Delivery State: IMPLEMENTED_AWAITING_VERIFICATION
Created: 2026-09-01

## Feature Shape

Sprint 2 establishes the first usable target-domain foundation without replacing the legacy SOP workflow:

- `SUPER_ADMIN` is a platform role, not workflow authority;
- Process has `FACULTY | DEPARTMENT` scope;
- every Process has exactly one Process Owner and one or more Process Members;
- Super Admin can manage Process, Department, owner, and members from the client;
- legacy OPD/evaluation/TTE paths remain intact during migration.

## Current Position

`VERIFY -> QUALITY GATES`

Implementation is present on branch `feat/fti-process-foundation`.

## Evidence Present

- additive Prisma foundation for `PlatformRole`, `Department`, `Process`, and Process membership;
- dedicated platform-admin authorization boundary;
- Process/Department/team server contract;
- Super Admin client administration route and Process management UI;
- focused Process service and Platform Admin guard tests added;
- DB invariants updated for the additive target-domain foundation;
- lean path-scoped Server CI and Client CI added;
- CI intentionally excludes default Docker/MariaDB integration, Playwright/E2E, deploy/release, coverage, and known noisy repository-wide lint.

## Remaining Before Sprint 2 Can Close

- observe an actual CI run and fix any real compile/test/build failures;
- verify TanStack route generation keeps the committed route tree synchronized;
- establish an explicit non-self-service bootstrap/provisioning path for the first `SUPER_ADMIN` without turning a legacy workflow role into platform authority;
- report exact verification evidence before marking RELEASE READY.

Do not merge, release, or deploy merely because implementation exists.

---

# Planned Next Iteration

Iteration: Sprint 3 — Process-Owned SOP Authoring
Status: PLANNED_NEXT

Sprint 3 becomes active only after Sprint 2 exits verification.

## Sprint Goal

Move the first SOP authoring slice from OPD/global-role ownership toward Process-context ownership end to end, without migrating review, final approval, TTE, or the entire legacy workflow.

Success means:

```text
Process Owner / Process Member
-> chooses an assigned Process
-> creates a new SOP owned by that Process
-> sees Process-owned SOPs they are allowed to author
-> opens and edits the draft
-> another unrelated Process user cannot access/edit it
```

The server establishes only the smallest stable Process-authoring contract, and the client consumes each contract immediately. Do not accumulate a backend-only migration backlog.

## Current Legacy Boundary To Replace

Today authoring still assumes:

```text
SOP.opdId
+ user OPD
+ global PENYUSUN / PJ_PENYUSUN role
```

Current create/list/workbench behavior resolves access through `UserOpdAccessService`, while the target domain requires contextual Process membership.

Sprint 3 changes the ownership/authoring seam only.

## Delivery Strategy

Use:

`Expand -> Contextual Policy Seam -> Client Consume -> Verify -> Next Slice`

For each slice:

```text
small server contract/policy
-> focused unit evidence
-> client API/query/UI immediately consumes it
-> type/build/unit verification
-> next slice
```

Server should remain at most one small contract ahead of the client.

## Planned Vertical Slices

### Slice A — My Process Context

Goal: give an authenticated user a canonical view of Processes in which they participate.

Server:

- expose the minimum current-user Process context required for authoring;
- return contextual relationship (`OWNER` or `MEMBER`) rather than inventing a global `PROCESS_OWNER` role;
- ordinary users see only Processes they participate in;
- Super Admin does not become a Process participant implicitly.

Client immediately follows:

- add Process context/query typing;
- expose Process selection where SOP authoring starts;
- do not redesign unrelated legacy navigation yet.

Exit evidence:

```text
Owner of Process A -> sees Process A
Member of Process A -> sees Process A
unrelated user -> does not see Process A
Super Admin only -> does not automatically see Process A as author
```

### Slice B — Process-Owned SOP Create + List

Goal: make new target-path SOP ownership explicit.

Server:

- introduce the smallest additive association from SOP to Process;
- new target-path create request identifies `processId`;
- service validates that caller is Process Owner or Process Member;
- Process association becomes authoritative for target-path authoring authorization;
- legacy SOP rows remain readable through the existing compatibility path;
- do not bulk-map all historical SOPs in this sprint.

Client immediately follows:

- create SOP form includes Process selection from the caller's allowed Processes;
- created/listed target SOP shows its Process context;
- client does not infer access from legacy role labels.

Exit evidence:

```text
Process A member + processId=A -> create allowed
unrelated user + processId=A -> denied
Super Admin only + processId=A -> denied
new SOP -> persisted Process association
```

### Slice C — Process-Aware Draft Workbench

Goal: move draft read/edit authorization for target-path SOPs to Process membership.

Server:

- when an SOP is Process-owned, workbench/header/procedure draft mutations authorize through Process relationship;
- legacy SOPs with no target association continue through legacy OPD compatibility behavior;
- preserve existing editability/status invariants;
- do not alter review/evaluation/final-approval transitions.

Client immediately follows:

- reuse the existing SOP editor rather than building a second editor;
- Process Owner and Members can open/edit target drafts;
- UI displays Process context sufficiently to avoid ambiguity;
- legacy SOP editor behavior remains available during migration.

Exit evidence:

```text
Process A member -> can edit Process A draft
Process B member -> cannot edit Process A draft
Process Owner -> can author/edit like a member
status/editability rules remain unchanged
```

### Slice D — Authoring Boundary Cutover Proof

Goal: prove Process-owned SOP authoring is isolated from the still-legacy review path.

Verify:

- target-path create/list/edit uses Process authorization;
- legacy SOP rows still work through legacy compatibility authorization;
- Process-owned draft cannot accidentally enter legacy evaluator flow merely because the user has a legacy role;
- no new workflow authority is granted by `SUPER_ADMIN`;
- no broad evaluator/TTE changes are introduced.

At the end of Sprint 3 the intended boundary is:

```text
TARGET PATH
Process relationship
-> SOP create/list/edit

LEGACY PATH
OPD/global roles
-> retained review/evaluation/TTE compatibility
```

Sprint 4 can then move the **submit/review** boundary from legacy evaluator semantics to Process Owner review.

## Critical Compatibility Decision Gate

Current `SOP.opdId` is required and many legacy paths still assume it is authoritative.

Do not silently invent a Process-to-OPD mapping or reinterpret Process scope as OPD ownership.

Before implementing Slice B, inspect all write/read dependencies of `SOP.opdId` and choose the smallest reversible compatibility representation that allows target Process ownership without contaminating target semantics.

Candidate techniques may include an additive nullable target association and an explicit compatibility projection/adapter, but the implementation must not:

- make Process taxonomy equal organizational hierarchy;
- make creator OPD the new product ownership rule merely because the legacy column exists;
- bulk-remap historical SOPs without an unambiguous mapping;
- drop or reinterpret existing OPD data destructively.

If the only implementation requires ambiguous data ownership or destructive migration, stop and surface the decision.

## Explicit Non-Goals

Do not in Sprint 3:

- remove `OPD`, `opdId`, `PENYUSUN`, or `PJ_PENYUSUN` globally;
- migrate Process Owner review yet;
- remove evaluator/PJ Evaluator workflow;
- change Dean/Kadep final approval;
- change TTE authority/signature behavior;
- migrate all historical SOPs;
- change public archive ownership/routing;
- redesign Pelaksana/Peraturan ownership unless required to keep the Process-owned draft usable;
- add generic RBAC/ABAC, workflow engines, event buses, or configurable approval chains;
- make integration/E2E mandatory for every commit.

## Verification Strategy

Default fast feedback:

Server:

- Prisma validate/generate when schema changes;
- focused Process/SOP authorization unit tests;
- affected-package typecheck;
- targeted lint when useful;
- existing lean CI.

Client:

- build / route generation;
- typecheck;
- focused unit/component evidence where behavior exists;
- existing lean CI.

Escalate only when justified:

- because Sprint 3 changes persistence, inspect migration SQL and perform a targeted MariaDB migration/invariant rehearsal before closing the sprint if the invariant depends on DB behavior;
- use one targeted browser journey only when UI integration reaches a risk that component/build evidence cannot prove;
- do not run the entire integration or E2E suite by default.

## Sprint 3 Stop Conditions

Stop and surface if implementation requires:

- ambiguous historical SOP-to-Process mapping;
- destructive migration;
- public API contract break that cannot be made additive;
- a new security/authority boundary not already approved;
- Process ownership to be inferred from OPD/Department semantics that are not canonical;
- changes to evaluation/TTE merely to make draft authoring compile.

## Expected Next Sprint After Sprint 3

Sprint 4 — Process Owner Review

```text
Process Member / Owner
-> submit draft
-> Process Owner review
   -> revision
   -> accepted / ready for final approval
```

That sprint should replace the relevant evaluator semantics only for the proven Process-owned path, while preserving final approval/TTE until the following slice.

## Tracking Rules

- Sprint 2 remains the active iteration until verification closes it.
- Sprint 3 is a planned next iteration, not active implementation state yet.
- Keep work oriented around `Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`.
- Do not upgrade implementation state to merged/release-ready/released/deployed without evidence.