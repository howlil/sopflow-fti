# Current Iteration

## Shape

**Milestone:** M6 — FTI Administration Bootstrap & Configuration Integrity  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: prove a platform `SUPER_ADMIN` can bootstrap FTI structure through the existing target administration UI and that the resulting Department, Process Team, Dean, and Head of Department configuration becomes real contextual workflow capability without granting the administrator a workflow bypass.

M6 is an administration/bootstrap integrity milestone. Reuse the existing Process and organizational-authority model; do not introduce generic RBAC, new workflow roles, authority history/revocation semantics, in-flight reassignment behavior, destructive legacy cleanup, release/deploy, or protected Edit SOP workspace changes.

## Previous Milestone Closure

M5 — Process Version Lifecycle Cutover & Historical Integrity is complete and integrated.

```text
PR #11 merge: 32a73437d9af70226a4a8e209177787ddbef6f37
Source head: 2b8bf99d78dd54a309e0aba0e7f8c1aa91e4cfce
Client CI: 33623375048 PASS
Server CI: 33623375157 PASS
FTI Critical E2E: 33623375077 PASS (J08-J19)
Protected Edit SOP implementation unchanged
Release/deploy: not performed
```

## Position

```text
Admin Entry & Isolation                      ACTIVE
Process Configuration Bootstrap              PLANNED
Organizational Authority Configuration       PLANNED
Configuration → Workflow Propagation          PLANNED
Milestone Gate                               PENDING
```

Current branch:

```text
m6-administration-bootstrap
```

## Slice Plan

### J20 — Admin Entry & Isolation

Prove only `platformRole = SUPER_ADMIN` receives the FTI administration entry points and can use Process/authority administration APIs. Process Owner, Member, Dean, and Head of Department remain ordinary workflow identities and are denied platform administration. `SUPER_ADMIN` alone must not gain Process authoring/review/final-approval/TTE capability.

### J21 — Process Configuration Bootstrap

Through the existing admin UI, create a Department and a Department-scoped Process with one valid Process Owner and at least one distinct active Member. Verify persisted scope, Department binding, owner/member assignment, duplicate-owner exclusion, and immediate contextual visibility for assigned identities while an unrelated identity remains isolated.

### J22 — Organizational Authority Configuration

Through the existing authority UI, prove one active Dean configuration for Faculty scope and one Head of Department per Department. Verify assignment is deterministic, scoped correctly, immediately reflected by `/organizational-authority/mine`, and does not leak authority to unrelated identities. Any temporary mutation of the seeded global Dean must be restored inside the journey.

### J23 — Configuration to Workflow Bootstrap

Bootstrap a fresh Department Process through the administration boundary, then prove the configured Member can enter target Process work, submit a Process SOP, and the configured Process Owner receives the owner-review capability. The platform administrator must remain outside that Process workflow unless explicitly assigned as Owner/Member.

## Boundaries

In scope:

- existing Department/Process administration;
- Process Owner/Member assignment integrity;
- Dean and Department Head assignment integrity;
- platform-admin authorization and workflow isolation;
- immediate runtime propagation from configuration to contextual target capability;
- FTI critical browser registry extended through J23.

Out of scope:

- delete/deactivate semantics for Process/Department/authority;
- authority assignment history or revocation redesign;
- in-flight workflow reassignment semantics;
- generic RBAC/permission editor;
- destructive legacy cleanup;
- target Process revocation/cabutan authority;
- public archive redesign;
- release/deployment;
- protected Edit SOP workspace implementation changes.

## Verification

```text
Client CI
Server CI
Migration Smoke only when migration-relevant inputs change
FTI Critical E2E J08-J23
SUPER_ADMIN-only administration access
SUPER_ADMIN is not a workflow bypass
persisted Department / Process / team configuration matches UI intent
Dean and Head of Department assignments stay scope-correct
configured Process relationships propagate to Member/Owner workflow capability
protected Edit SOP implementation unchanged
```

## Next Move

Implement J20 admin entry/isolation, then execute J21-J23 continuously on the same milestone branch. Patch production behavior only when a journey exposes a real contract defect; otherwise keep M6 as verification/bootstrap hardening.
