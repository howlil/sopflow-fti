# PROJECT

## Product

SOPFlow FTI manages the complete SOP lifecycle for Fakultas Teknologi Informasi: authoring, Process review, contextual final approval, electronic signing, publication, public verification, version replacement, and revocation.

## Actors

- **Platform Admin**: configures accounts, departments, owner eligibility, and organizational authority assignments.
- **Process Owner**: owns a Process, manages its team, and reviews submitted SOP work.
- **Process Member / Penyusun SOP**: authors SOPs within Processes they belong to.
- **Dean**: final approval and TTE authority for Faculty-scoped Processes.
- **Head of Department**: final approval and TTE authority for that Department's Processes.

## Core journey

```text
Create/choose Process
 -> author SOP
 -> submit for Process review
 -> revise or accept
 -> contextual final approval
 -> TTE
 -> Effective/public archive
 -> optional new version or revocation
```

## Product invariants

- Active SOP ownership is direct to `Process`.
- Platform administration is not workflow authority.
- Review authorization is Process-contextual.
- Final approval and TTE holder are derived from Process organizational scope.
- Faculty Process resolves to Dean; Department Process resolves to that Department Head.
- Signing evidence stores contextual organizational authority.
- Peraturan and Pelaksana are reusable global catalogs.
- Public archive and public signing verification expose current FTI semantics.
- Historical migration SQL is immutable implementation history and is not a product contract.

## Engineering boundary

Preserve SOP editor/procedure/diagram behavior unless a requested user outcome requires changing it. Prefer the smallest coherent vertical change and proportional verification.
