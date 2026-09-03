# Current Iteration

## Shape

**Milestone:** M10 — FTI-Native Public SOP Discovery & Archive Cutover  
**State:** IMPLEMENTED / VERIFICATION_PENDING  
**Integration branch:** `m10-public-fti-archive`  
**Base master:** `7b9941bebe6852b79dcdfadbf3efc345603e9c2d`

Outcome target: public visitors discover current FTI SOPs through organizational scope and Process context, open the official published PDF, and stop seeing a Process-bound SOP immediately after contextual revocation, while legacy public endpoints remain compatibility contracts.

M10 is one bounded public-discovery capability delivered continuously through J35-J38.

## Position

```text
J35 Public FTI Catalog                 IMPLEMENTED
J36 Public Process Discovery           IMPLEMENTED
J37 Official Document Continuity       IMPLEMENTED
J38 Publication Compatibility          IMPLEMENTED
M10 milestone gate                     VERIFICATION_PENDING
Release readiness                      NOT YET CLAIMED
Release/deployment                     NOT PERFORMED
```

## Implemented Behavior

### J35 — Public FTI Catalog

- `ProcessSopBinding` is the authoritative target classification for Process-bound SOPs in the public catalog;
- additive public endpoints are available under `/sop/public/fti/...`;
- Process catalog rows expose Process scope and Department context;
- only SOP versions that are `BERLAKU` and have an official `PUBLISHED` PDF are target-public;
- Process-bound rows are excluded from the legacy-unbound fallback branch of target global search, preventing duplicate publication results.

### J36 — Public Process Discovery

- normal `/arsip` navigation is Process-first rather than OPD-first;
- faculty and department Processes are visually grouped from persisted `OrganizationalScope` / Department evidence;
- selecting a Process loads only its current published SOPs;
- global search remains a shortcut across title, SOP number, Process, and Department;
- route state uses `processId`; legacy `opdId` remains accepted only as compatibility input so old URLs do not crash the route parser.

### J37 — Official Document Continuity

- target catalog results continue to point at the existing `/sop/public/pdf/:detailSopId` official artifact endpoint;
- PDF serving still re-validates current `BERLAKU` + published-artifact evidence on every request;
- the public preview reuses the existing official PDF pane rather than introducing a second document representation.

### J38 — Publication Compatibility

- legacy `/sop/public/opd`, `/sop/public/opd/:opdId/sop`, and `/sop/public/sop` APIs remain available;
- legacy/unbound published SOPs remain discoverable through the target global archive fallback;
- a Process-bound SOP appears once in target global discovery even though legacy compatibility data still exists;
- contextual revocation removes the SOP from target public discovery and makes the existing official PDF endpoint return its revoked/unavailable response.

## Public API Additions

```text
GET /sop/public/fti/processes
GET /sop/public/fti/processes/:processId/sop
GET /sop/public/fti/sop
```

These endpoints are additive. No public legacy endpoint is removed or repurposed in M10.

## Verification Selection

Default M10 browser evidence is risk-selected to the changed capability:

```text
J35 Public FTI Catalog
J36 Public Process Discovery
J37 Official Document Continuity
J38 Publication Compatibility
```

Expected milestone gate:

```text
Server CI
- Prisma validate/generate
- typecheck
- core unit tests
- focused public FTI catalog tests

Client CI
- production build / route generation
- route-tree consistency
- typecheck
- unit tests

FTI Critical E2E
- journey registry audit
- J35-J38 as one coherent browser run

Migration Smoke
- NOT SELECTED: M10 changes no Prisma schema or migration input
```

Older journeys are added only if an observed failure indicates broader coupling.

## Boundaries Preserved

- no Prisma schema or migration change;
- no authoring/review/approval/TTE/revocation authority change;
- no destructive OPD/legacy data migration;
- no removal of legacy public endpoints;
- no Edit SOP protected-surface change;
- no new PDF generation/storage model;
- no public authentication requirement;
- no release/deployment.

## Delta

J35-J38 source implementation and focused journey coverage are present on the milestone branch. Exact-head CI/browser evidence, PR integration, and integrated-master evidence are still pending.

## Next Move

Complete final diff/static audit, open one coherent M10 PR, run Server CI + Client CI + FTI Critical E2E J35-J38 on the exact PR head, fix only failures that invalidate the bounded capability, merge after all required evidence is green, verify integrated master, then update this file to `INTEGRATED / RELEASE_READY` and **STOP**. Do not release or deploy.