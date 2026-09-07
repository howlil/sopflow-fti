# Database invariants — FTI target schema

## Identity
- `Pengguna.email` and `Pengguna.nip` are unique.
- Platform administration is represented only by `platformRole`.

## ProsesBisnis
- A ProsesBisnis has one owner.
- Faculty ProsesBisnis has no `departemenId`.
- Departemen ProsesBisnis has a valid `departemenId`.
- ProsesBisnis keanggotaan is unique by `(prosesBisnisId, penggunaId)`.

## SOP
- Active SOP ownership is `SOP.prosesBisnisId`.
- Version identity is unique by `(sopId, versi)`.
- `DetailSOP.status` uses only the native siklus enum.
- Effective/version replacement/revocation transitions must preserve a coherent version chain.

## Review and approval
- ProsesBisnis review evidence belongs to the same ProsesBisnis/SOP/detail being transitioned.
- Final approval references the accepted ProsesBisnis review and resolved pejabat berwenang.
- Faculty approval authority is Dean. Departemen approval authority is that Departemen Head.

## TTE
- TTE documents for SOPs are bound to `detailSopId` and `prosesBisnisId`.
- Signing history stores contextual `PejabatBerwenang` and signer/certificate evidence.
- A signed version must transition from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence.

## Catalogs
- Peraturan identity is unique by `(nomor, tahun)`.
- Pelaksana name is globally unique.

## Migration-history boundary
Previously applied migration SQL is immutable. Post-contraction audits validate the target schema after the full migration chain rather than treating removed structures as active invariants.
