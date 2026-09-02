# Current Iteration

## Shape

**Milestone:** M8 — Contextual SOP Revocation & Effective-State Integrity  
**State:** INTEGRATED / RELEASE_READY  
**Integration branch:** `master`

Outcome: a Process-bound SOP that is already effective can be revoked through the same contextual organizational authority model used for final approval and TTE, while public/effective visibility is removed and historical/audit/TTE evidence remains intact.

M8 was delivered as one bounded lifecycle capability through J28-J30 and integrated as one coherent PR.

## Position

```text
J28 Contextual Revocation Authority          VERIFIED / INTEGRATED
J29 Authority Revocation Surface             VERIFIED / INTEGRATED
J30 Effective/Public Integrity               VERIFIED / INTEGRATED
M8 milestone gate                            PASS
Release readiness                            READY
Release/deployment                           NOT PERFORMED
```

## Delivered Behavior

### J28 — Contextual Revocation Authority

- Process-bound revocation resolves `ProcessSopBinding` and uses `OrganizationalAuthorityService` as the authority source.
- `FACULTY` Process revocation belongs to the active `DEAN`.
- `DEPARTMENT` Process revocation belongs to the active `HEAD_OF_DEPARTMENT` for that department.
- Process Owner, Process Member, unrelated authority holders, and `SUPER_ADMIN` without the relevant organizational authority do not gain revocation rights.
- revocation requires an existing `BERLAKU` version and is rejected while a revision is in flight.
- legacy/unbound SOP revocation remains on the compatibility path.

### J29 — Authority Revocation Surface

- the existing FTI authority surface at `/approval` lists effective SOPs inside the signed-in authority holder's scope;
- the authority holder can invoke `Cabut SOP` with an explicit confirmation that the SOP will no longer be effective;
- no legacy `KEPALA_OPD` identity is required for Process-bound revocation.

### J30 — Effective/Public Integrity

- `BERLAKU -> DICABUT` remains a terminal state transition, not deletion;
- the existing status transaction records the acting user and marks the published TTE artifact `REVOKED`;
- revoked SOPs stop satisfying public/effective `BERLAKU` queries;
- public document access is unavailable and revoked official PDF access preserves the existing `410 Gone` contract;
- version history, approval/TTE evidence, audit evidence, and stored artifacts remain preserved as historical evidence.

## Verification Evidence

Exact verified source head:

```text
2b427f5c8d024c9f9b3a0905a8d13295237c496d
```

Source-head gate:

```text
Server CI #210                 PASS
Client CI #288                 PASS
FTI Critical E2E #85 J28-J30  PASS
Migration Smoke                NOT RUN / NOT REQUIRED
```

Server evidence included Prisma validation/generation, TypeScript typecheck, core unit tests, and focused FTI target-domain tests including contextual revocation.

Client evidence included production build/route generation, generated route-tree consistency, TypeScript typecheck, and unit tests.

FTI Critical E2E proved:

- J28 Faculty/Department contextual authority and denial paths;
- J29 FTI-native revocation interaction;
- J30 effective/public removal with historical version preservation.

Migration Smoke was intentionally not run because the final M8 diff contains no migration-relevant Prisma schema or migration input.

Integration:

```text
PR #15 squash merged
master integration SHA: 2d0f7739f9f0496c5e2cfa36973856fc22b79c10
Integrated Server CI #211  PASS
Integrated Client CI #289  PASS
```

FTI Critical E2E is PR-scoped and did not rerun on the merge commit; exact source-head J28-J30 evidence was green before integration.

## Boundaries Preserved

- no new schema/status was introduced; existing `DICABUT` semantics are reused;
- no OPD table/column/enum/role removal;
- no `SOP.opdId` cleanup;
- no broad persisted role/status rename;
- no public archive information-architecture redesign;
- no generic revocation workflow engine, approval-chain engine, bulk/scheduled revocation, mandatory reason/document, or second approval workflow;
- `SUPER_ADMIN` remains platform administration, not a workflow bypass;
- legacy/unbound behavior remains compatible;
- no release/deployment was performed.

## Delta

No M8 implementation, verification, or integration work remains.

## Next Move

**STOP.** M8 is integrated and release-ready. Await an explicit next product objective or explicit release/deployment direction. Do not invent M9 or promote deferred legacy cleanup into scope.