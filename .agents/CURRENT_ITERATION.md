# Current Iteration

## Shape

**Milestone:** M4 — Department Workflow Parity & Isolation  
**State:** RELEASE_READY  
**Integration branch:** `master`

Outcome achieved: Department-scoped Process SOPs execute the same FTI-native lifecycle as Faculty-scoped SOPs while final approval, notifications, TTE authority, and Process access remain isolated to the relevant Department.

M4 introduced no new approval tier, generic approval engine, SUPER_ADMIN workflow bypass, destructive legacy cleanup, or protected Edit SOP workspace change.

## Position

```text
Department Context & Isolation               INTEGRATED
Department Owner Review                      INTEGRATED
Kadep Final Approval + Notification           INTEGRATED
Kadep TTE + Public Integrity                  INTEGRATED
Milestone Gate                                PASS
```

## Integrated Journeys

### J12 — Department Context Isolation

Two deterministic Department contexts prove Process relationship and organizational-authority isolation. Department A actors do not gain Department B workflow access, and SUPER_ADMIN remains administrative rather than workflow-authorized.

### J13 — Department Process Review

A Department Member submits a Process SOP, the relevant Process Owner reviews it and can return it for revision, and unrelated Process membership does not authorize workbench access.

### J14 — Department Final Approval

Process Owner acceptance resolves `FINAL_APPROVAL_REQUESTED` to the relevant Head of Department. Dean, unrelated Head of Department, and SUPER_ADMIN cannot approve the Department SOP; the relevant Head can approve it for TTE.

### J15 — Department TTE/Public Integrity

The relevant Head of Department uses the existing real TTE path. Signing transitions the SOP to `BERLAKU`, persists the official artifact, and exposes the SOP through the public archive without internal workflow/evaluation data.

## Milestone Gate Evidence

Integrated through PR #9 using squash merge:

```text
source head:       77f7f8eaa38247aa6b533e84917cfdcd17a90b4d
master merge:      c644b5a86a66153ef3934fabaebf69413a7fc735
Client CI:         33559540503 PASS
Server CI:         33559540442 PASS
Migration Smoke:   33559540449 PASS
FTI Critical E2E:  33559540423 PASS (J08-J15)
```

Protected Edit SOP evidence:

```text
client/src/pages/penyusun/sop/detail/DetailSOPPenyusun.tsx
branch/master blob: 9f699be21dbb45759693dc8ecb0d29d3f4d194fd
unchanged: YES
```

## Delivery State

```text
implemented: YES
verified: YES
integrated: YES
release-ready: YES
released: NO
deployed: NO
```

Release/deploy remain intentionally outside M4 scope.

## Guardrail

The protected Edit SOP workspace remains protected. Future work must not alter it unless the current user instruction explicitly targets that surface.

## Next Move

STOP. M4 is complete and release-ready. Await explicit user intent before defining or starting another milestone.
