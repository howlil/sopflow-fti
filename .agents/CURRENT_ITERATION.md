# Current Iteration

## Shape

**Milestone:** M4 — Department Workflow Parity & Isolation  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: prove that Department-scoped Process SOPs execute the same FTI-native lifecycle as Faculty-scoped SOPs while final approval, notifications, TTE authority, and Process access remain isolated to the relevant Department.

M4 closes a committed product parity gap. It must not introduce a new approval tier, generic approval engine, SUPER_ADMIN workflow bypass, destructive legacy cleanup, or protected Edit SOP workspace changes.

## Previous Milestone Closure

M3 — FTI Critical Journey Hardening is complete and integrated.

```text
PR #7 merge: 397d1d8ab7741e2496229d1d1a1fdf05edace7f5
Client CI: 33553070911       PASS
FTI Critical E2E: 33553070917 PASS (J08-J11)
implemented: YES
verified: YES
integrated: YES
release/deploy: intentionally skipped by user direction
```

## Boundaries

In scope:

- deterministic Department A / Department B target fixtures;
- Department Process relationship isolation;
- Department Member submit and relevant Process Owner review/revision;
- contextual final approval and notification resolution to the relevant Head of Department;
- denial for Dean, unrelated Head of Department, unrelated Process Member, and SUPER_ADMIN where the capability is not granted by the relevant dimension;
- real contextual TTE signing and public handoff for a Department SOP;
- path-scoped FTI critical browser coverage J12-J15 while preserving J08-J11.

Out of scope:

- new workflow states/features;
- third approval level;
- configurable approval chains;
- destructive legacy schema/route cleanup;
- public archive IA redesign;
- production release/deployment;
- protected Edit SOP workspace implementation changes.

## Position

```text
Department Context & Isolation              ACTIVE
Department Owner Review                     PLANNED
Kadep Final Approval + Notification          PLANNED
Kadep TTE + Public Integrity                 PLANNED
Milestone Gate                               PENDING
```

Current branch:

```text
m4-department-parity
```

## Slice Plan

### J12 — Department Context Isolation

Prove two Department contexts are deterministic and isolated. A member from Department A must not gain access to Department B work. Heads of Department see only their own authority context. SUPER_ADMIN remains administrative, not workflow-authorized.

### J13 — Department Process Review

Department Member creates/submits a complete Process SOP, relevant Process Owner receives it, requests revision, and the same Department Member receives the revision work back. Unrelated Process membership must not authorize workbench access.

### J14 — Department Final Approval

Relevant Process Owner ACCEPT resolves `FINAL_APPROVAL_REQUESTED` to the relevant Head of Department. Dean and unrelated Head of Department must not approve the Department SOP. The relevant Head approves and leaves it ready for TTE.

### J15 — Department TTE/Public Integrity

Relevant Head of Department uses the real existing TTE credential/signing path. Successful signing transitions the Department SOP to `BERLAKU`, persists the official artifact, and exposes the SOP through the public archive without internal workflow/evaluation data.

## Verification

Milestone gate requires evidence proportional to changed risk:

```text
Client CI
Server CI when server code changes
Migration Smoke for seed/schema/migration-relevant changes
FTI Critical E2E J08-J15
Protected Edit SOP implementation unchanged
No unresolved authorization/TTE/public-integrity stop condition
```

## Guardrail

The protected Edit SOP workspace may be exercised by browser journeys but must not be modified to make M4 pass.

## Next Move

Implement deterministic two-Department target fixtures and J12 isolation proof, then continue J13-J15 without starting a new planning cycle.
