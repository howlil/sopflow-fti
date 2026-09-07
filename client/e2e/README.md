# SOPFlow FTI E2E

The E2E suite models only current FTI actors and journeys.

## Actors
- Platform Admin
- ProsesBisnis Owner
- ProsesBisnis Member / Penyusun SOP
- Dean
- Head of Departemen

## Seed
Run the server target seed before browser journeys. The seed creates Departemens, ProsesBisnises, owner eligibility, ProsesBisnis membership, organizational authority assignments, Peraturan, and Pelaksana.

## Environment
Use the target E2E identities supplied by `client/e2e/fixtures/target-users.ts` and the configured seed password. Do not add global workflow-role fixtures.

## Critical journeys
- ProsesBisnis-scoped SOP authoring
- ProsesBisnis Owner review and revision
- Faculty/Departemen contextual final approval
- TTE and public verification
- version integrity / supersede
- revocation

Tests should assert native lifecycle values directly.
