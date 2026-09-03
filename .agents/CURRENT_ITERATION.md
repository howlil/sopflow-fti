# Current Iteration

## Shape

**Milestone:** M10 — FTI-Native Public SOP Discovery & Archive Cutover  
**State:** INTEGRATED / RELEASE_READY  
**Source branch:** `m10-public-fti-archive`  
**PR:** #17  
**Squash merge:** `d7013075de45a154088415adb67522a539d335bc`

Outcome: public visitors discover current FTI SOPs through organizational scope and Process context, open the official published PDF, and stop seeing a Process-bound SOP immediately after contextual revocation, while legacy public endpoints remain compatibility contracts.

## Position

```text
J35 Public FTI Catalog                 VERIFIED / INTEGRATED
J36 Public Process Discovery           VERIFIED / INTEGRATED
J37 Official Document Continuity       VERIFIED / INTEGRATED
J38 Publication Compatibility          VERIFIED / INTEGRATED
M10 milestone gate                     PASS
Release readiness                      RELEASE_READY
Release/deployment                     NOT PERFORMED
```

## Exact Source-Head Evidence

Source head: `20316c17afcb41fef9d816dfd96bca9d02c6946c`

```text
Server CI #262                       PASS
Client CI #361                       PASS
FTI Critical E2E #110 — J35-J38      PASS
Migration Smoke                       NOT SELECTED — no Prisma schema/migration input changed
```

The source head and squash merge share the same tree: `eced201a9b7076b859bf9b680b528bbd729098b9`.

## Integration

```text
PR #17                               MERGED
Squash merge SHA                     d7013075de45a154088415adb67522a539d335bc
```

## Integrated Master Evidence

Integrated master revision: `d7013075de45a154088415adb67522a539d335bc`

```text
Server CI #263                       PASS
Client CI #362                       PASS
```

FTI Critical E2E is pull-request scoped and therefore did not run again on master. Its exact source-head evidence applies to the identical integrated tree. Migration Smoke did not run and was not required because M10 changed no Prisma schema or migration input.

## Integrated Behavior

### J35 — Public FTI Catalog

- `ProcessSopBinding` is the authoritative target classification for Process-bound SOPs in the public catalog;
- additive target endpoints are available under `/sop/public/fti/...`;
- Process catalog rows expose faculty/department scope and Department context;
- target-public rows require `BERLAKU` plus an official `PUBLISHED` PDF artifact;
- Process-bound rows are excluded from the legacy-unbound fallback of target global search, preventing duplicate target publication results.

### J36 — Public Process Discovery

- normal `/arsip` navigation is Process-first rather than OPD-first;
- faculty and department Processes are grouped from persisted organizational scope;
- selecting a Process scopes the public SOP list to that Process;
- global search remains a shortcut across SOP title/number, Process, and Department;
- `processId` is the target route context while legacy `opdId` search input remains parse-compatible for old URLs.

### J37 — Official Document Continuity

- target public results reuse `/sop/public/pdf/:detailSopId`;
- the existing PDF endpoint revalidates current effective/published evidence on each request;
- the archive preview reuses the official PDF artifact rather than creating a parallel public document representation.

### J38 — Publication Compatibility

- legacy `/sop/public/opd`, `/sop/public/opd/:opdId/sop`, and `/sop/public/sop` endpoints remain available;
- legacy/unbound published SOPs remain available through target global compatibility fallback;
- a Process-bound SOP appears once in target global discovery despite its legacy OPD compatibility shadow;
- contextual revocation removes it from current target discovery and official public PDF availability while preserving historical evidence.

## Public API Additions

```text
GET /sop/public/fti/processes
GET /sop/public/fti/processes/:processId/sop
GET /sop/public/fti/sop
```

## Boundaries Preserved

- no Prisma schema or migration change;
- no authoring/review/approval/TTE/revocation authority change;
- no destructive OPD/legacy data migration;
- no removal of legacy public endpoints;
- no Edit SOP protected-surface change;
- no new PDF generation/storage model;
- no public authentication requirement;
- no release/deployment.

## Release / Deployment

```text
RELEASED: NO
DEPLOYED: NO
```

M10 is integrated and release-ready only. Release and deployment remain unauthorized.

## Next Move

**STOP.** M10 is closed at `INTEGRATED / RELEASE_READY`. Do not invent or activate M11, promote deferred legacy cleanup, release, or deploy without a new explicit user instruction.
