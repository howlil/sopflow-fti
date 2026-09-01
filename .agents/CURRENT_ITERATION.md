# Current Iteration

Iteration: Sprint 4 — Global Pelaksana Catalog & Process-Native Procedure Authoring
Delivery State: VERIFIED_BRANCH
Branch: `feat/global-pelaksana-catalog`
Created: 2026-09-01

## Feature Shape

Sprint 4 removes legacy OPD ownership from the target Pelaksana semantics and completes Process-contextual procedure authoring for Process-bound SOPs.

Implemented target shape:

```text
Global Pelaksana Catalog
  -> reusable across Process / Department / Faculty
  -> creator/latest-editor attribution

SOP Version
  -> selects Pelaksana as swimlanes
  -> snapshots displayed actor labels

Process Owner / Member
  -> edits procedure for Process-bound SOP
  -> step actor must belong to that SOP version's swimlane set
```

Legacy unbound SOPs retain compatibility authorization until a later contract-cleanup slice.

## Current Position

`QUALITY GATES -> STOP`

Sprint 4 implementation is verified on its branch. It is not merged, released, or deployed.

## Completed Delta

- Pelaksana list/create/edit semantics are global rather than OPD-owned on the target path.
- Active authenticated users may maintain the global catalog without receiving Process review/final-approval authority from that permission.
- New Pelaksana mutations retain creator/latest-editor attribution; unknown legacy attribution remains `NULL` rather than fabricated.
- `DetailSOPPelaksanaSnapshot` preserves the actor label used by a versioned SOP so later catalog renames do not rewrite historical wording.
- Process-bound procedure mutations authorize through Process Owner/Member relationship.
- Legacy unbound SOP procedure mutations retain the existing role/OPD compatibility path.
- `LangkahSOP.pelaksanaId` must reference a Pelaksana selected into `DetailSOPPelaksana` for the same `DetailSOP`.
- Exact normalized duplicate Pelaksana rows can be consolidated and their swimlane/step references rewired to one canonical actor.
- Legacy same-OPD Pelaksana triggers are retired before cross-OPD rewiring; replacement swimlane-consistency triggers are installed after consolidation.
- Client Pelaksana management consumes the global catalog contract.
- TanStack generated route tree is synchronized and committed.
- `.agents/PROJECT.md` and `server/prisma/DB-INVARIANTS.md` now record the global Pelaksana domain and persistence invariants.

## Verification Evidence

### Server

- Prisma validate/generate: PASS.
- Typecheck: PASS.
- Core unit suite: PASS.
- Focused target-domain authorization tests: PASS.
- Server CI passed after the final migration SQL fix on commit `ea13d18abc3a80c75b855ced670ba45b1c1b5276`.

### Client

- Production build and route regeneration: PASS.
- Generated route-tree consistency gate: PASS.
- Typecheck: PASS.
- Unit tests: PASS.
- Client CI passed after isolating the Dashboard layout unit fixture from Process-query infrastructure.

### Targeted MariaDB Migration Rehearsal

A single Sprint-4-focused MariaDB 11.4 rehearsal passed.

The rehearsal verified:

```text
Sprint 3 relational baseline
-> install relevant legacy same-OPD Pelaksana triggers
-> seed exact duplicate Pelaksana across two OPDs
-> apply Sprint 4 migration through Prisma migrate engine
-> verify canonical dedup/reference rewiring
-> verify snapshot backfill/stability
-> verify global actor-name uniqueness
-> verify new same-DetailSOP swimlane trigger
```

The rehearsal found and drove fixes for two real migration defects before closure:

1. legacy same-OPD triggers initially remained active during cross-OPD duplicate rewiring; they are now retired before dedup;
2. MariaDB rejected an ambiguous `urutan` reference in the duplicate-swimlane upsert; target-row columns are now qualified explicitly.

Final targeted rehearsal run `33504916971`: PASS.

## Residual Compatibility

These are intentional and are not Sprint 4 completion failures:

- physical `Pelaksana.opdId` remains as a legacy compatibility shadow; it is no longer target ownership/authorization semantics;
- legacy SOPs without `ProcessSopBinding` still use compatibility procedure authorization;
- Process Owner review/evaluator migration is not part of Sprint 4;
- Dean/Kadep final approval and TTE authority are unchanged;
- public archive grouping is unchanged;
- deletion/merge administration for Pelaksana was not expanded.

## Known Repository Verification Debt

A first attempt to replay the full historical migration chain on a fresh database failed in a pre-Sprint-4 migration around `20260502000000...` because that legacy migration references a table before the historical chain has created it.

Sprint 4 did not modify that old migration history because repairing the entire historical chain is outside this bounded slice. The Sprint 4 migration itself was instead verified against the Sprint 3 schema baseline with the relevant legacy Pelaksana triggers installed explicitly.

Do not interpret the targeted rehearsal as proof that the repository's entire historical migration chain is fresh-database clean.

## Next Move

Sprint 5 — Process Owner Review is the next planned meaningful iteration, but it is not started by this state update.

Target direction:

```text
Process Owner / Member
-> submit Process-owned SOP
-> Process Owner review
   -> revision
   -> accepted / ready for final approval
```

Do not merge, release, or deploy Sprint 4 without explicit user authorization.
