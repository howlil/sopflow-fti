# Database invariants — FTI target schema

## Identity
- `Pengguna.email` and `Pengguna.nip` are unique.
- Platform administration is represented only by `platformRole`.

## Process
- A Process has one owner.
- Faculty Process has no `departmentId`.
- Department Process has a valid `departmentId`.
- Process membership is unique by `(processId, penggunaId)`.

## SOP
- Active SOP ownership is `SOP.processId`.
- Version identity is unique by `(sopId, versi)`.
- `DetailSOP.status` uses only the native lifecycle enum.
- Effective/version replacement/revocation transitions must preserve a coherent version chain.

## Review and approval
- Process review evidence belongs to the same Process/SOP/detail being transitioned.
- Final approval references the accepted Process review and resolved organizational authority.
- Faculty approval authority is Dean. Department approval authority is that Department Head.

## TTE
- TTE documents for SOPs are bound to `detailSopId` and `processId`.
- Signing history stores contextual `OrganizationalAuthority` and signer/certificate evidence.
- A signed version must transition from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence.

## Catalogs
- Peraturan identity is unique by `(nomor, tahun)`.
- Pelaksana name is globally unique.

## Migration-history boundary
Previously applied migration SQL is immutable. Post-contraction audits validate the target schema after the full migration chain rather than treating removed structures as active invariants.
