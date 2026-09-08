# Database invariants — FTI target schema

## Identity

- `Pengguna.email` and `Pengguna.nip` are unique.
- Platform administration is represented only by `platformRole`.
- `Pengguna.nohp` must satisfy the canonical Indonesian mobile-number database check.

## ProsesBisnis

- A ProsesBisnis has one owner.
- Faculty ProsesBisnis has no `departmentId`.
- Department ProsesBisnis has a valid `departmentId`.
- ProsesBisnis membership is unique by `(processId, penggunaId)`.
- Database triggers reject inconsistent `scope` / `departmentId` combinations on insert and update.

## SOP

- Active SOP ownership is `SOP.processId`.
- Active workflow versions (`DRAFT`, `PROCESS_REVIEW`, `REVISION_REQUIRED`, `FINAL_APPROVAL`, `TTE_PENDING`) must belong to an SOP with a non-null `processId`.
- An active SOP cannot have its Process ownership removed while an active workflow version exists.
- Imported archive rows may remain unbound only outside the active workflow states above.
- Version identity is unique by `(sopId, versi)`.
- `DetailSOP.status` uses only the native lifecycle enum.
- At most one `DetailSOP` per SOP may be `EFFECTIVE`; database triggers enforce this on insert and update.
- Version replacement and revocation transitions preserve a coherent version chain.
- `SopTerkait` cannot point to itself.
- A branch target in `LangkahSOP` must belong to the same `DetailSOP`.
- A `LangkahSOP` pelaksana must already be selected as a swimlane for the same `DetailSOP`.

## Process review

- `REVISION` review evidence must transition `PROCESS_REVIEW -> REVISION_REQUIRED` and include a non-empty note.
- `ACCEPT` review evidence must transition `PROCESS_REVIEW -> FINAL_APPROVAL`.
- Review evidence must refer to the same `DetailSOP`, SOP, and Process ownership chain.
- `reviewedById` must be the owner of that Process.
- These rules are enforced by database triggers on insert and update, not only by service validation.

## Organizational authority and final approval

- `DEAN` assignment uses `authorityKey = DEAN` and has no `departmentId`.
- `HEAD_OF_DEPARTMENT` assignment requires a Department and uses `authorityKey = HEAD_OF_DEPARTMENT:<departmentId>`.
- Final approval must reference an `ACCEPT` Process review for the same `detailSopId` and `processId`.
- `approvedById`, `authority`, and `authorityKey` must resolve to the holder of the organizational authority assignment for that Process scope.
- Faculty approval authority is Dean. Department approval authority is that Department Head.
- Database triggers enforce these cross-table relationships on insert and update.

## TTE

- TTE documents for SOPs are bound to `detailSopId` and `processId`.
- `DokumenTte.processId` must equal the Process that owns the SOP containing that `DetailSOP`; the database rejects cross-Process TTE documents.
- Signing history stores contextual `PejabatBerwenang` and signer/certificate evidence.
- A signed version transitions from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence in the application transaction.

## Catalogs

- Peraturan identity is unique by `(nomor, tahun)`.
- Pelaksana name is globally unique.

## Enforcement boundary

- Foreign keys, unique/index constraints, physical column contracts, database checks, and trigger presence are verified by `db:audit:fti`.
- `target-db-domain-invariant-audit.ts` also scans existing rows for cross-table workflow contradictions, so a deployment cannot be considered healthy merely because the triggers exist.
- Multi-write workflow atomicity (for example status transition + evidence + notification) remains an application transaction concern; the database constrains the resulting state so contradictory records cannot be inserted directly.

## Migration baseline

- `0_fti_native_baseline` is the canonical schema baseline for a fresh database.
- `1_fti_native_invariants` installs database invariants that Prisma schema cannot express.
- Existing target databases mark `0_fti_native_baseline` as applied once, then deploy `1_fti_native_invariants` normally.
- Every migration committed after this baseline must be forward-only and FTI-native.
