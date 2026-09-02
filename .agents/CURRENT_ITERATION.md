# Current Iteration

## Shape

**Milestone:** M8 — Contextual SOP Revocation & Effective-State Integrity  
**State:** IMPLEMENTED / VERIFICATION_PENDING  
**Integration branch:** `m8-contextual-revocation`

Outcome target: a Process-bound SOP that is already effective can be revoked through the same contextual organizational authority model used for final approval and TTE, while public/effective visibility is removed and historical/audit/TTE evidence remains intact.

M8 is one bounded lifecycle capability milestone and is delivered continuously through J28-J30 rather than separate planning cycles or tiny integration PRs.

## Position

```text
J28 Contextual Revocation Authority          IMPLEMENTED
J29 Authority Revocation Surface             IMPLEMENTED
J30 Effective/Public Integrity               IMPLEMENTED
M8 milestone gate                            VERIFICATION_PENDING
Release readiness                            NOT YET CLAIMED
Release/deployment                           NOT PERFORMED
```

## Implemented Behavior

### J28 — Contextual Revocation Authority

- Process-bound revocation resolves `ProcessSopBinding` and uses `OrganizationalAuthorityService` as the authority source.
- `FACULTY` Process revocation belongs to the active `DEAN`.
- `DEPARTMENT` Process revocation belongs to the active `HEAD_OF_DEPARTMENT` for that department.
- Process Owner, Process Member, unrelated authority holders, and `SUPER_ADMIN` without the relevant organizational authority do not gain revocation rights.
- revocation requires an existing `BERLAKU` version and is rejected while a revision is in flight.
- legacy/unbound SOP revocation remains on the compatibility path.

### J29 — Authority Revocation Surface

- the existing FTI authority surface at `/approval` now lists effective SOPs inside the signed-in authority holder's scope;
- the authority holder can invoke `Cabut SOP` with an explicit confirmation that the SOP will no longer be effective;
- no legacy `KEPALA_OPD` identity is required for Process-bound revocation.

### J30 — Effective/Public Integrity

- `BERLAKU -> DICABUT` remains a terminal state transition, not deletion;
- the existing status transaction records the acting user and marks the published TTE artifact `REVOKED`;
- revoked SOPs stop satisfying public/effective `BERLAKU` queries and public document/PDF access;
- version history, approval/TTE evidence, audit evidence, and stored artifacts are preserved as historical evidence.

## Verification Selection

M8 changes one bounded authority + effective/public lifecycle boundary. Default browser evidence is therefore:

```text
J28 Contextual Revocation Authority
J29 Authority Revocation Surface
J30 Effective/Public Integrity
```

J17-J19 are added only if verification shows that version-replacement semantics were materially affected. Full historical J01-J30 is not the default gate.

Expected gate:

```text
Server CI
- Prisma validate/generate
- typecheck
- core unit tests
- focused target-domain tests including process-sop-revocation.service.spec.ts

Client CI
- production build / route generation
- generated route-tree consistency
- typecheck
- unit tests

FTI Critical E2E
- journey registry audit
- risk-selected J28-J30

Migration Smoke
- not required unless a migration-relevant input appears in the final diff
```

## Boundaries Preserved

- no new schema/status is introduced; existing `DICABUT` semantics are reused;
- no OPD table/column/enum/role removal;
- no `SOP.opdId` cleanup;
- no broad persisted role/status rename;
- no public archive information-architecture redesign;
- no generic revocation workflow engine, approval-chain engine, bulk/scheduled revocation, mandatory reason/document, or second approval workflow;
- `SUPER_ADMIN` remains platform administration, not a workflow bypass;
- legacy/unbound behavior remains compatible;
- no release/deployment.

## Delta

Implementation for J28-J30 is present on the milestone branch. Verification and integration evidence are not yet complete, so M8 must not be described as verified, integrated, or release-ready yet.

## Next Move

Run the proportional M8 gate on the exact branch head, fix only failures that invalidate the bounded capability, integrate one coherent M8 PR after green evidence, verify the integrated master revision, then update this file to `INTEGRATED / RELEASE_READY` and **STOP**. Do not invent M9 or promote deferred legacy cleanup into scope.