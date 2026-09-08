# SOPFlow FTI E2E

The browser E2E suite is manual-only. GitHub Actions must not execute it or use E2E changes as CI triggers.

The suite models only current FTI actors and journeys.

## Actors
- Platform Admin
- ProsesBisnis Owner
- ProsesBisnis Member / Penyusun SOP
- Dean
- Head of Departemen

## Seed
Run the server target seed before browser journeys. The seed creates Departemen, ProsesBisnis, kelayakan penanggung jawab Proses Bisnis, keanggotaan ProsesBisnis, pejabat berwenang assignments, Peraturan, and Pelaksana.

## Environment
Use the target E2E identities supplied by `client/e2e/fixtures/users.ts` and the configured seed password. Do not add global workflow-role fixtures.

## Critical journeys
- ProsesBisnis-scoped SOP authoring
- ProsesBisnis Owner review and revision
- Faculty/Departemen contextual final approval
- TTE and public verification
- version integrity / supersede
- revocation

Tests should assert native siklus values directly.
