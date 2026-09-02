# Current Iteration

## Shape

**Milestone:** M6 — FTI Administration Bootstrap & Configuration Integrity  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: prove that a `SUPER_ADMIN` can bootstrap and maintain the target FTI workflow configuration through the existing administration surfaces, and that Department, Process Team, and organizational-authority assignments immediately drive real workflow capability without making platform administration a workflow bypass.

M6 is an operational/configuration-integrity milestone. It must not introduce target revocation authority, a generic RBAC/approval engine, destructive legacy cleanup, delete/deactivate semantics, release/deploy, or protected Edit SOP workspace changes.

## Previous Milestone Closure

M5 — Process Version Lifecycle Cutover & Historical Integrity is complete and integrated.

```text
PR #11 source head: 2b8bf99d78dd54a309e0aba0e7f8c1aa91e4cfce
PR #11 merge:       32a73437d9af70226a4a8e209177787ddbef6f37
Client CI:          33623375048 PASS
Server CI:          33623375157 PASS
FTI Critical E2E:   33623375077 PASS (J08-J19)
```

M5 verified contextual Process version creation, Faculty/Department replacement, one-effective-version behavior, superseded official artifacts, historical lineage, and failed-signing atomicity. Migration Smoke was not required because no migration-relevant inputs changed. Protected Edit SOP remained unchanged.

## Position

```text
Admin Entry & Isolation                     ACTIVE
Process Configuration                       PLANNED
Organizational Authority Configuration      PLANNED
Configuration → Workflow Bootstrap           PLANNED
Milestone Gate                              PENDING
```

Current branch:

```text
m6-admin-bootstrap-integrity
```

## Slice Plan

### J20 — Admin Entry & Isolation

Prove target administration is a platform capability: SUPER_ADMIN can reach Process/Authority administration, normal USER actors cannot mutate those resources, and SUPER_ADMIN alone gains no Process authoring/review/final-approval/TTE authority.

### J21 — Process Configuration

Through the target Process administration surface, create a uniquely named Department and Department-scoped Process, assign one Process Owner and at least one Member, then edit the Process configuration and verify the resulting Process contexts reflect the saved assignments.

### J22 — Organizational Authority Configuration

Through the target authority administration surface, verify Dean configuration and assign a Head of Department for a uniquely created Department. Non-admin mutation must be denied and the assigned holder's contextual authority must update immediately. Any temporary global Dean reassignment used for verification must be restored within the journey.

### J23 — Configuration → Workflow Bootstrap

Create a unique Department, Process Team, and relevant Head-of-Department through target administration surfaces, then run a Process-bound SOP through Member authoring, Process Owner review, contextual final approval, TTE, effective state, and public handoff. The business configuration under test must not come from the seeded Process topology.

## Boundaries

In scope:

- existing `/admin/processes` and `/admin/authorities` target surfaces;
- Department and Process creation/update;
- Process Owner/Member assignments;
- Dean and Head-of-Department configuration;
- platform-admin isolation from workflow authority;
- configuration propagation into Process/authority capability;
- full configured-Process workflow bootstrap proof;
- FTI critical journey registry extended through J23.

Out of scope:

- target Process revocation/cabutan authority semantics;
- Department/Process deletion or deactivation behavior;
- in-flight authority reassignment semantics;
- authority-history redesign;
- generic RBAC or configurable approval-chain engines;
- destructive legacy table/role/route cleanup;
- public archive IA redesign;
- release/deployment;
- protected Edit SOP workspace implementation changes.

## Stop Condition

If M6 requires deciding who may revoke/cabut a target Process SOP, stop that sub-scope. Platform administration must not be converted into business/legal workflow authority by inference.

## Verification

```text
Client CI
Server CI
Migration Smoke only when migration-relevant inputs change
FTI Critical E2E J08-J23
admin mutation permitted only to platform admin
SUPER_ADMIN remains non-workflow-authorized without contextual assignment
new Process/team configuration propagates immediately
new organizational authority propagates immediately
J23 uses runtime-created configuration rather than seeded Process topology
protected Edit SOP implementation unchanged
```

## Next Move

Implement J20 Admin Entry & Isolation, then continue J21-J23 continuously without a new planning cycle.
