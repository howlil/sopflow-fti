# Database invariants — FTI target schema

## Identity

- `Pengguna.email` and `Pengguna.nip` are unique.
- Platform administration is represented only by `platformRole`.
- `Pengguna.nohp` must satisfy the canonical Indonesian mobile-number database check.
- `SUPER_ADMIN` cannot be a Process owner/member, Process Owner authority recipient, or organizational authority holder; workflow relationships use `USER` identities.

## ProsesBisnis

- A ProsesBisnis has one owner.
- A Process Owner account has exactly one active owner-eligibility scope; historical revoked scopes may remain.
- Faculty ProsesBisnis has no `departmentId`.
- Department ProsesBisnis has a valid `departmentId`.
- The Process owner must have an active owner-eligibility record matching the Process scope and department.
- ProsesBisnis membership is unique by `(processId, penggunaId)`.
- Database triggers reject inconsistent `scope` / `departmentId` combinations on insert and update.

## SOP

- Every SOP belongs to exactly one ProsesBisnis through required `SOP.processId` ownership.
- `SOP.processId` cannot be null for active, effective, superseded, or revoked SOPs.
- Version identity is unique by `(sopId, versi)`.
- `DetailSOP.status` uses only the native lifecycle enum.
- At most one `DetailSOP` per SOP may be `EFFECTIVE`; database triggers enforce this on insert and update.
- Version replacement and revocation transitions preserve a coherent version chain.
- `SopTerkait` cannot point to itself.
- A branch target in `LangkahSOP` must belong to the same `DetailSOP`.
- A `LangkahSOP` pelaksana must already be selected as a swimlane for the same `DetailSOP`.

## Process review

- `REVISION` review evidence must transition `PROCESS_REVIEW -> REVISION_REQUIRED` and include a non-empty note.
- `ACCEPT` review evidence must transition `PROCESS_REVIEW -> TTE_PENDING`.
- Review evidence must refer to the same `DetailSOP`, SOP, and Process ownership chain.
- `reviewedById` must be the owner of that Process.
- These rules are enforced by database triggers on insert and update, not only by service validation.

## Organizational authority and direct TTE

- `DEAN` assignment uses `authorityKey = DEAN` and has no `departmentId`.
- `HEAD_OF_DEPARTMENT` assignment requires a Department and uses `authorityKey = HEAD_OF_DEPARTMENT:<departmentId>`.
- The canonical authority key is unique: exactly one current holder exists for the Faculty entity and for each Department entity.
- Organizational authority holders must be workflow `USER` identities.
- Faculty signing authority is Dean. Department signing authority is that Department Head.
- TTE authority is resolved directly from the Process scope and current organizational authority assignment.
- `FINAL_APPROVAL` and `ProcessFinalApproval` are not part of the target schema.

## TTE

- TTE documents for SOPs are bound to `detailSopId` and `processId`.
- `DokumenTte.processId` must equal the Process that owns the SOP containing that `DetailSOP`; the database rejects cross-Process TTE documents.
- Signing history stores contextual `PejabatBerwenang` and signer/certificate evidence.
- A signed version transitions from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence in the application transaction.
- The signer is resolved from the current Process scope and authority assignment.

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
- `2_fti_workflow_identity_invariants` prevents platform-admin identities from entering workflow relationships through direct writes.
- `3_require_sop_process` contracts `SOP.processId` to `NOT NULL` and removes transitional null-ownership triggers.
- `6_single_process_owner_scope` enforces one active owner scope per account and matching Process ownership through database triggers.
- `9_remove_final_approval` normalizes legacy final-approval rows into direct TTE state, removes `ProcessFinalApproval`, and contracts the status/notification enums.
- Existing databases must contain no SOP with null `processId` before migration 3 can apply; the migration fails instead of deleting or inventing ownership.
- Every migration committed after this baseline must be forward-only and FTI-native.
