# PROJECT

## Product

SOPFlow FTI manages the complete SOP lifecycle for Fakultas Teknologi Informasi: authoring, ProsesBisnis review, contextual final approval, electronic signing, publication, public verification, version replacement, and revocation.

## Actors

- **Platform Admin**: configures accounts, departments, owner eligibility, and organizational authority assignments.
- **ProsesBisnis Owner**: owns a ProsesBisnis, manages its team, and reviews submitted SOP work.
- **ProsesBisnis Member / Penyusun SOP**: authors SOPs within ProsesBisnises they belong to.
- **Dean**: final approval and TTE authority for Faculty-scoped ProsesBisnises.
- **Head of Departemen**: final approval and TTE authority for that Departemen's ProsesBisnises.

## Core journey

```text
Create/choose ProsesBisnis
 -> author SOP
 -> submit for ProsesBisnis review
 -> revise or accept
 -> contextual final approval
 -> TTE
 -> Effective/public archive
 -> optional new version or revocation
```

## Product invariants

- Active SOP ownership is direct to `ProsesBisnis`.
- Platform administration is not workflow authority.
- Review authorization is ProsesBisnis-contextual.
- Final approval and TTE holder are derived from ProsesBisnis organizational scope.
- Faculty ProsesBisnis resolves to Dean; Departemen ProsesBisnis resolves to that Departemen Head.
- Signing evidence stores contextual organizational authority.
- Peraturan and Pelaksana are reusable global catalogs.
- Public archive and public signing verification expose current FTI semantics.
- Historical migration SQL is immutable implementation history and is not a product contract.

## Engineering boundary

Preserve SOP editor/procedure/diagram behavior unless a requested user outcome requires changing it. Prefer the smallest coherent vertical change and proportional verification.
