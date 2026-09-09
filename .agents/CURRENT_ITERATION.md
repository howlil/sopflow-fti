# CURRENT ITERATION

## State

The FTI-native runtime is being realigned to the canonical actor responsibilities on `master`.

Current actor model:

- identity: `Pengguna` + `PlatformRole`;
- administration: **Administrator Sistem** manages accounts, Departemen, PJ eligibility/scope, and Pejabat Berwenang assignments only;
- authoring: **Penyusun SOP / Anggota Proses Bisnis** exclusively creates and edits SOP;
- coordination: **Penanggung Jawab Proses Bisnis (PJ Penyusun / Process Owner)** creates/manages Proses Bisnis, manages Penyusun, assigns a primary Penyusun to an SOP, performs pemeriksaan, requests revision, or declares the SOP ready to be submitted;
- legal/organizational authority: **Pejabat Berwenang** performs pengesahan and TTE; `FACULTY -> DEAN`, `DEPARTMENT -> relevant HEAD_OF_DEPARTMENT`;
- Peraturan and Pelaksana are global FTI catalogs; active PJ or Anggota may mutate them, while the catalog itself has no organizational/user ownership;
- active SOP ownership remains direct `SOP.prosesBisnisId`;
- `PenugasanPenyusunSOP` is coordination metadata, not an authoring ACL;
- `SUPER_ADMIN` remains administration-only and cannot bypass workflow authorization.

## Workflow

```text
Administrator Sistem
  -> konfigurasi akun / Departemen / kewenangan

Penanggung Jawab Proses Bisnis
  -> bentuk Proses Bisnis
  -> kelola Penyusun
  -> assign Penyusun utama per SOP

Penyusun SOP
  -> buat / edit SOP
  -> kirim untuk pemeriksaan

Penanggung Jawab Proses Bisnis
  -> Minta Revisi -> Penyusun
  -> Nyatakan Siap Diajukan -> Pejabat Berwenang

Pejabat Berwenang
  -> Pengesahan
  -> TTE
  -> EFFECTIVE
```

## Frontend realignment

Current change set replaces generic dashboard/card CRUD with domain-driven surfaces:

- capability-specific route guards for authoring, PJ management, and Pejabat Berwenang;
- `/work` is a capability resolver rather than a duplicate launcher page;
- Administration surfaces use table-first CRUD with create/edit dialogs;
- Pekerjaan SOP is table-first;
- PJ pemeriksaan uses a read-only SOP preview and never opens the protected SOP edit workspace;
- Pejabat Berwenang uses table + read-only inspection + pengesahan/TTE actions;
- Process management, Penyusun management, and SOP assignment use tables/dialogs;
- SOP edit workspace remains protected and unchanged.

## Persistence change

New additive model/migrations:

- `PenugasanPenyusunSOP` / table `SopDrafterAssignment`;
- DB invariants require the assigned Penyusun to be a `ProcessMember`, the SOP to belong to the same Process, and the assigner to be the Process owner;
- removing a ProcessMember clears that user's SOP coordination assignments.

Prisma is configured as a multi-file schema folder (`prisma/`) so the assignment model can live under `prisma/models/` without expanding the legacy canonical schema file.

## Verification state

The previous green revisions predate this actor-boundary/UI change and are not evidence for the current head.

Required before claiming this change green:

1. Prisma validate/generate against the multi-file schema.
2. Server TypeScript typecheck + focused workflow/unit tests.
3. Client TypeScript/build + focused UI tests.
4. Migration smoke for the new assignment table/triggers.
5. FTI DB audit because the physical target schema changed.

Browser E2E remains optional unless lower-layer evidence exposes a cross-boundary issue.

## Current delivery state

`IMPLEMENTED_ON_MASTER_AWAITING_CURRENT_HEAD_CI`.

Do not treat historical CI from earlier revisions as proof for this change. The next meaningful transition is current-head CI + migration/DB evidence green.