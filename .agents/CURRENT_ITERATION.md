# Current Milestone

Milestone: FTI-native Workflow Experience Cutover
Delivery State: MILESTONE_ACTIVE
Integration Branch: `master`
Created: 2026-09-02

## Previous Milestone

`Process-bound SOP Workflow Cutover` is complete.

Delivered target path:

```text
Process Owner / Member
  -> Process-bound authoring
  -> Process Owner review
  -> contextual final approval
       -> FACULTY -> DEAN
       -> DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
  -> contextual TTE by the same resolved authority boundary
  -> official published artifact
  -> BERLAKU
```

Completion evidence:

- Migration Smoke `33522522783`: PASS for the target persistence chain.
- Client CI `33535035787`: PASS for production/SSR build, generated routes, typecheck, and unit tests.
- Server CI `33535489438`: PASS on final M1 head `7b502e1295a431d96e27230ce4c932b7765cc902`, including Faculty/Department signer paths and Process TTE integrity coverage.

M1 compatibility decisions remain intentional:

- legacy/unbound SOP behavior remains available behind compatibility paths;
- persisted legacy status names may remain while product semantics are target-native;
- `SOP.opdId` / `ProcessSopBinding` remain transitional persistence seams;
- no destructive historical remapping was performed.

## Milestone Shape

Move the authenticated product experience from legacy government-role/workflow vocabulary to the FTI Process model that is already implemented in the target backend path.

The milestone is an experience/contract-semantic cutover, not a destructive schema cleanup.

Target outcome:

```text
Authenticated user
  -> sees capabilities derived from actual context
       -> Process relationship
       -> Organizational authority
       -> Platform administration
  -> enters Process-native work queues
  -> sees FTI-native workflow language
  -> receives contextual notifications
  -> does not need to understand legacy
     PENYUSUN / EVALUATOR / PJ_* / KEPALA_OPD semantics
     for Process-bound SOP work
```

## Why This Milestone Exists

M1 cut over the target workflow semantics, but significant product surfaces still expose legacy navigation, role vocabulary, OPD-era queues, or compatibility concepts.

The next useful product outcome is therefore to make the implemented target workflow understandable and operable as an FTI application without requiring users to mentally translate the old government-domain model.

## Boundaries

In scope:

- authenticated navigation and entry points for Process-bound SOP work;
- Process Owner / Process Member work queues and actions;
- Dean / Head-of-Department approval and TTE entry points;
- FTI-native labels/copy for target workflow states and actions;
- contextual notification recipients and copy for target-path workflow events;
- isolation of legacy UI/routes so they remain compatibility behavior rather than the primary Process-bound path;
- preserve existing Process authorization, final-approval, TTE, audit, version, and publication invariants.

Out of scope:

- dropping legacy tables, columns, enums, or roles;
- removing `SOP.opdId` or `ProcessSopBinding`;
- destructive historical data migration;
- mechanically renaming OPD to Faculty;
- redesigning public archive grouping without an explicit product decision;
- changing the two-level approval model;
- adding a centralized evaluator layer;
- adding SUPER_ADMIN workflow bypass;
- introducing generic configurable approval chains.

## Slice State

| Slice | Outcome | State |
| --- | --- | --- |
| Contextual Entry & Navigation | primary authenticated navigation reflects Process / authority / admin capabilities | PLANNED |
| Process Work Queues | Process Owner and Members can find target SOP work without legacy evaluator/penyusun mental model | PLANNED |
| FTI Workflow Vocabulary | Process-bound statuses, actions, headers, and help text use target FTI semantics | PLANNED |
| Contextual Notifications | target workflow events resolve recipients and copy through Process/authority context | PLANNED |
| Legacy Surface Isolation | legacy routes remain explicit compatibility surfaces and are not primary target navigation | PLANNED |

Historical sprint numbers are implementation history only and are not the planning model.

## Current Position

`MILESTONE PLAN -> READY TO EXECUTE FIRST SLICE`

No implementation slice is active yet. This file now defines the M2 boundary before continuous execution starts.

## Product Semantics To Preserve

Authorization dimensions stay separate:

```text
Platform Role
  -> SUPER_ADMIN | USER

Process Relationship
  -> PROCESS_OWNER | MEMBER | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

Primary target workflow remains:

```text
Process Owner / Member
  -> Draft
  -> Submit for Process Owner review

Process Owner
  -> request revision
  -> or accept for final approval

Final authority
  -> FACULTY: Dean
  -> DEPARTMENT: relevant Head of Department
  -> approve
  -> contextual TTE
  -> BERLAKU
```

The UI must derive available actions from these capabilities rather than merely relabeling legacy global roles.

## Milestone Gate

Do not mark M2 RELEASE READY until:

- Process-bound users can navigate their normal workflow without depending on legacy role-specific entry points;
- Process Owner vs Member capabilities are visibly and functionally distinct where required;
- Dean/Kadep approval + TTE surfaces are discoverable from organizational authority, not `KEPALA_OPD` identity;
- target-path user-facing copy no longer presents centralized evaluator/PJ evaluator semantics as FTI product truth;
- contextual notifications for Process review and final authority paths are verified;
- legacy/unbound compatibility remains operable and clearly isolated;
- Client CI and Server CI are green for the integrated milestone state;
- no target authorization or legal/TTE invariant regresses.

## Stop Conditions

Stop continuous execution if this milestone requires:

- a destructive schema/data migration;
- removal of legacy public/API contracts needed by existing compatibility behavior;
- a new public archive information architecture decision;
- a material change to Process ownership, approval authority, or legal/TTE semantics;
- reinterpretation of historical workflow evidence;
- a new product role or approval level not already canonical.

## Next Move

Inspect the authenticated routing/sidebar/home-entry logic and current Process-bound SOP entry points, then implement the smallest first slice that makes target capabilities discoverable without changing backend authority semantics.
