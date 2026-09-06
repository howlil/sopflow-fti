# Current Repository State

This file is the canonical resumable state for ongoing work. Product truth and the committed end state are owned by `PROJECT.md`.

## Target Shape

**Canonical target:** Full FTI.

Normal first-party behavior derives from:

```text
Platform Role
+ Process Owner eligibility / Process Relationship
+ Organizational Authority
+ Process-owned SOP
```

Legacy OPD identity and global workflow-role values may survive only as historical persistence evidence. They are not valid first-party authorization, routing, discovery, or current-account inputs.

## Current Milestone — Full FTI Semantic Cleanup

This iteration closes the remaining active wrong-model and compatibility-contract residue after legacy runtime retirement.

### Active first-party semantics

- public landing and login identify the product as SOPFlow FTI / Fakultas Teknologi Informasi;
- the visible lifecycle is Penyusunan → Review Proses → Persetujuan Akhir → TTE → Berlaku;
- first-party responsibility is expressed as Penyusun SOP, Pemilik Proses, and contextual organizational authority rather than a global workflow-role matrix;
- workbench reads no longer join OPD or discover a `KEPALA_OPD` user;
- workbench signing metadata is projected as contextual `signingAuthority` from Process scope and Organizational Authority;
- current workbench activity-log projection does not read `Pengguna.peran`;
- `ProcessContext` does not read or project `peran`;
- Process SOP list contracts do not expose `opdId`;
- current TTE payload naming is authority-neutral; historical `RiwayatTandaTangan.peran` remains immutable point-in-time evidence;
- user-facing status labels use FTI lifecycle terminology while the persisted `StatusSOP` enum remains compatibility-safe.

### Native setup and test world

The canonical seed is FTI-native:

- current seed identities have `Pengguna.opdId = null` and `Pengguna.peran = null`;
- setup creates Department, Process Owner eligibility, Process, Process membership, Dean/Head-of-Department assignments, global Peraturan, and global Pelaksana;
- the seed does not create an “OPD FTI”, active `RiwayatOpdPengguna`, or `OPDPeraturan` ownership world;
- signing-certificate development defaults identify FTI/SOPFlow rather than the retired Sumbar/Biro deployment context;
- executable browser business journeys are the `fti-*` journeys; the old OPD/global-role Playwright matrix and old J01–J38 coverage ceremony are retired;
- obsolete OPD/evaluation/RBAC integration suites are retired rather than kept as false target-product evidence.

### Dead active contracts retired

This iteration removes or guards against reintroduction of active legacy surfaces including:

- client organisasi/OPD compatibility components and public OPD DTOs;
- `TTERole` compatibility type;
- `cabut-sop.util` legacy authorization wording;
- old Create SOP / manual status DTOs;
- compatibility `sop-status-policy`;
- orphan OPD catalog repository methods;
- legacy public/login branding and role vocabulary;
- test fixtures that model PJ Evaluator / Evaluator / Kepala OPD / PJ Penyusun / Penyusun as the current product authority model.

The Full FTI runtime source audit now treats these as regression boundaries.

## Protected Surface Boundary

The existing SOP workspace/editor, procedure engine, and diagram engine remain protected. This semantic cleanup changes their upstream read contract/adapter only where required to remove legacy ownership/authority semantics; it does not redesign or rewrite protected authoring behavior.

## Historical Retention Boundary

Historical data remains intentionally retained:

- historical `OPD`, `RiwayatOpdPengguna`, and `OPDPeraturan` rows;
- nullable historical shadows `Pengguna.opdId`, `Pengguna.peran`, and `SOP.opdId`;
- `LegacySopRetention` provenance for SOPs outside target Process ownership;
- historical `PengajuanEvaluasi` / evaluation evidence;
- `RiwayatTandaTangan.peran` as signing evidence;
- retired Process/SOP binding migration evidence.

Do not physically contract these merely because first-party runtime no longer consumes them. Persistence contraction is a later operation and requires production-shaped retention, migration, and rollback proof.

## Verification Gate

This milestone may merge only when one exact branch head passes all repository gates that apply to the change:

- Client CI;
- Server CI;
- FTI Domain CI;
- Migration Smoke;
- Full FTI Exit;
- Container Build.

The gate must prove Prisma validate/generate, native source-boundary audits, current unit/build contracts, complete migration-chain safety, and production container builds. Any concrete failure is fixed on the same milestone branch and the entire exact-head result is re-evaluated before merge.

## After Merge

Do not start another lexical cleanup milestone merely because historical tables, migrations, enums, or evidence contain legacy vocabulary.

Next action must come from a material product/release constraint:

```text
production retention / migration proof missing?
  -> audit the real retained data and rehearse contraction safely

first-party journey gap discovered?
  -> fix the user outcome

only proven-unused historical persistence remains?
  -> contract it with explicit retention and rollback evidence
```

Production deployment and physical legacy-data deletion are not claimed by this milestone.
