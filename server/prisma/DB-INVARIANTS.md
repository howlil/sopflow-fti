# Database invariants — FTI target schema

## Identity

- `Pengguna.email` and `Pengguna.nip` are unique.
- Platform administration is represented only by `platformRole`.

## ProsesBisnis

- A ProsesBisnis has one owner.
- Faculty ProsesBisnis has no `departmentId`.
- Department ProsesBisnis has a valid `departmentId`.
- ProsesBisnis membership is unique by `(processId, penggunaId)`.
- Database triggers reject inconsistent `scope` / `departmentId` combinations on insert and update.

## SOP

- Active SOP ownership is `SOP.processId`.
- Version identity is unique by `(sopId, versi)`.
- `DetailSOP.status` uses only the native lifecycle enum.
- At most one `DetailSOP` per SOP may be `EFFECTIVE`; database triggers enforce this on insert and update.
- Version replacement and revocation transitions preserve a coherent version chain.
- `SopTerkait` cannot point to itself.
- A branch target in `LangkahSOP` must belong to the same `DetailSOP`.
- A `LangkahSOP` pelaksana must already be selected as a swimlane for the same `DetailSOP`.

## Review and approval

- ProsesBisnis review evidence belongs to the same ProsesBisnis/SOP/detail being transitioned.
- Final approval references the accepted ProsesBisnis review and resolved pejabat berwenang.
- Faculty approval authority is Dean. Department approval authority is that Department Head.

## TTE

- TTE documents for SOPs are bound to `detailSopId` and `processId`.
- Signing history stores contextual `PejabatBerwenang` and signer/certificate evidence.
- A signed version transitions from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence.

## Catalogs

- Peraturan identity is unique by `(nomor, tahun)`.
- Pelaksana name is globally unique.

## Migration baseline

- `0_fti_native_baseline` is the canonical schema baseline for a fresh database.
- `1_fti_native_invariants` installs database invariants that Prisma schema cannot express.
- Existing target databases mark `0_fti_native_baseline` as applied once, then deploy `1_fti_native_invariants` normally.
- Every migration committed after this baseline must be forward-only and FTI-native.
