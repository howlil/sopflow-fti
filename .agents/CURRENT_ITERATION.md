# Current Iteration

Iteration: Sprint 2 — FTI Process Ownership Foundation
Delivery State: PLANNED
Created: 2026-09-01

## Feature Shape

Establish the first usable FTI target-domain vertical slice without a backend-heavy rewrite:

- explicit platform administration boundary for `SUPER_ADMIN` without workflow bypass;
- canonical Process with `FACULTY` or `DEPARTMENT` scope;
- exactly one Process Owner and one or more Process Members;
- a Super Admin client surface that can view/manage Process ownership and team assignments through the new server contract;
- legacy SOP/evaluation/TTE workflow remains operational and is not removed in this sprint.

This sprint proves the new domain model through a usable server + client path before migrating SOP authoring/review/approval onto it.

## Sprint Goal

Deliver one end-to-end administrative/domain foundation where a Super Admin can manage FTI Processes and their Process Teams from the client, backed by additive target-domain server contracts and persistence, while preserving existing SOP behavior.

Success means the new Process ownership model is no longer documentation-only: it exists as a working product path that the next SOP migration slice can depend on.

## Current Position

`UNDERSTAND -> BOUND -> SPECIFY -> DESIGN`

No production refactor implementation is recorded yet for Sprint 2.

## Delivery Strategy

Use incremental domain migration:

`Semantic Seam -> Expand -> Client Consume -> Verify -> Next Slice`

Do not build a large server foundation and defer the client until later.

For each slice, the server may lead only far enough to establish the smallest stable contract; the client should consume that contract immediately before moving to the next backend slice.

Preferred cadence:

```text
server contract/policy
-> minimal persistence/service/API
-> client type/API/query/UI
-> focused server + client verification
-> next slice
```

Avoid:

```text
all schema/backend
-> all services
-> all authorization
-> all APIs
-> client at the end
```

## Planned Vertical Slices

### Slice A — Platform Admin Boundary

Goal: make platform administration explicit without converting Super Admin into a god role.

Server delta:

- introduce the smallest additive representation of platform administration compatible with the target rule `SUPER_ADMIN != workflow authority`;
- expose platform administration identity/capability through the existing authenticated-user/session contract as needed by the client;
- preserve legacy workflow roles during migration rather than replacing them in one step;
- add focused authorization evidence showing Super Admin does not automatically receive Process review/final approval/TTE authority.

Client delta immediately after server contract:

- understand/display the new platform-admin capability in auth/access typing;
- add the minimum route/navigation guard required for the administration surface;
- do not redesign unrelated role navigation.

Exit evidence:

- Super Admin can reach the administration boundary;
- ordinary users cannot;
- Super Admin alone does not gain SOP workflow authority.

### Slice B — Process Catalog

Goal: establish Process as a real target-domain resource.

Server delta:

- additive Process persistence and API contract;
- required scope is `FACULTY | DEPARTMENT`;
- a department-scoped Process identifies its concrete department context;
- no removal or reinterpretation of legacy `OPD` data yet.

Client delta immediately after server contract:

- Super Admin can list/create/edit the minimum Process fields required by the approved domain;
- UI makes Faculty vs Department scope visible;
- department context is required only for Department scope.

Exit evidence:

- one faculty-scoped Process and one department-scoped Process can be represented and retrieved end to end;
- invalid scope/context combinations are rejected.

### Slice C — Process Team Ownership

Goal: make Process ownership and membership usable rather than schema-only.

Server delta:

- assign exactly one Process Owner;
- assign one or more Process Members;
- prevent unrelated Process membership from granting access to another Process;
- keep Process role contextual rather than adding `PROCESS_OWNER` as a universal organization-wide power.

Client delta immediately after server contract:

- Super Admin can see the owner and members for a Process;
- Super Admin can assign/change owner and members through the same domain contract;
- UI does not imply that owner/member assignment changes Dean/Kadep authority.

Exit evidence:

- Process has exactly one owner and at least one member according to the approved invariant;
- membership is isolated between Process A and Process B;
- Super Admin can administer assignments but receives no implicit Process membership.

### Slice D — Integration Proof

Goal: prove this foundation is ready to become the ownership source for the next SOP vertical slice.

Verify together:

- server target-domain constraints and authorization;
- client administration journey;
- additive migration compatibility with legacy OPD-based SOP workflow;
- no regression to existing SOP authoring/evaluation/TTE behavior caused by the new foundation.

Do not attach all SOPs to Process, remove evaluator roles, or migrate TTE in this sprint.

## Delta

From the legacy architecture:

```text
Global OPD / workflow roles
```

Sprint 2 introduces alongside it:

```text
Platform Administration
  -> SUPER_ADMIN

Process
  -> FACULTY | DEPARTMENT
  -> exactly one Process Owner
  -> one or more Process Members
```

This is an additive expand phase, not the contract/removal phase.

## Explicit Non-Goals

Do not in Sprint 2:

- drop `OPD`, `opdId`, or legacy workflow role columns;
- migrate every existing SOP to Process;
- remove `EVALUATOR` / `PJ_EVALUATOR` yet;
- rewrite the entire SOP state machine;
- change final TTE implementation to Dean/Kadep yet;
- redesign public archive routing;
- migrate all existing evaluation history;
- introduce generic RBAC/ABAC, generic workflow engines, or configurable approval chains;
- perform destructive migration or ambiguous legacy-data remapping.

Those belong to later vertical slices after this target-domain foundation is proven.

## Verification Focus

Evidence should remain proportional to each slice.

Server:

- Prisma generate/validate when schema changes;
- focused domain/service tests;
- authorization negative tests;
- persistence/integration evidence when an invariant depends on MariaDB/migrations;
- affected-package typecheck/lint.

Client:

- auth/access typing and route guard evidence;
- API/query/mutation focused tests where useful;
- affected-package typecheck/lint;
- browser journey for the final Super Admin -> Process -> Process Team administration path when the slice reaches UI integration.

Cross-boundary acceptance evidence:

```text
Super Admin
-> opens Process administration
-> creates/edits Faculty or Department Process
-> assigns exactly one Process Owner + Members
-> reloads and sees persisted state
```

Negative-path evidence:

```text
ordinary user -> cannot administer Processes
Super Admin only -> cannot review/approve/sign SOP by admin privilege
Process A member -> no implicit Process B membership
DEPARTMENT Process -> requires concrete department context
```

## Next Refactor Slice After Sprint 2

The next meaningful product slice should attach SOP ownership/authoring to Process context end to end:

```text
Process Member / Process Owner
-> SOP belongs to Process
-> contextual authoring authorization
-> existing draft/edit UI follows the new contract
```

Only after that behavior is proven should the refactor move process review away from global evaluator roles, then migrate contextual final approval and TTE.

## Next Move

Inspect the current authentication/user schema and existing administration surfaces, then design the smallest additive representation for platform administration and Process ownership that preserves legacy compatibility. Start Slice A and move the client with the first stable contract; do not accumulate server-only work beyond that contract boundary.

## Tracking Rules

- This file is an orientation layer, not a second development lifecycle.
- Keep active work oriented around `Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`.
- The vertical-slice plan above exists because this refactor crosses persistence, authorization, API, and client boundaries; do not expand it into unrelated ceremony.
- Update evidence and current position as slices land.
- Never mark work RELEASED or DEPLOYED without evidence that the action actually occurred.
