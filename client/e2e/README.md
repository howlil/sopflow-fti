# SOPFlow FTI E2E

The E2E suite models only current FTI actors and journeys.

## Actors
- Platform Admin
- Process Owner
- Process Member / Penyusun SOP
- Dean
- Head of Department

## Seed
Run the server target seed before browser journeys. The seed creates Departments, Processes, owner eligibility, Process membership, organizational authority assignments, Peraturan, and Pelaksana.

## Environment
Use the target E2E identities supplied by `client/e2e/fixtures/target-users.ts` and the configured seed password. Do not add global workflow-role fixtures.

## Critical journeys
- Process-scoped SOP authoring
- Process Owner review and revision
- Faculty/Department contextual final approval
- TTE and public verification
- version integrity / supersede
- revocation

Tests should assert native lifecycle values directly.
