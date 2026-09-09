# CURRENT ITERATION

## State

The FTI-native product model is integrated on `master`. Legacy OPD/global-workflow-role runtime and historical migration-chain source have been retired from the target application.

Current runtime model:

- identity: `Pengguna` + `PlatformRole`;
- organization: `Departemen` + `ProsesBisnis`;
- platform administration: Admin creates accounts/Departemen, grants ProsesBisnis Owner eligibility/scope, and assigns contextual organizational authority;
- ProsesBisnis ownership: authorized Owner creates/renames/archives ProsesBisnis and manages/invites Members;
- authoring: ProsesBisnis Member / Penyusun SOP;
- review: ProsesBisnis Owner;
- final approval and TTE: `FACULTY -> DEAN`, `DEPARTMENT -> relevant HEAD_OF_DEPARTMENT`;
- SOP lifecycle: `DRAFT -> PROCESS_REVIEW -> REVISION_REQUIRED | FINAL_APPROVAL -> TTE_PENDING -> EFFECTIVE -> SUPERSEDED | REVOKED`;
- active SOP ownership: direct `SOP.prosesBisnisId`;
- public archive, signing verification, notification, versioning, and revocation are ProsesBisnis-native;
- `SUPER_ADMIN` is platform administration only and is forbidden from becoming Owner, Member, or contextual workflow authority, including through database-level invariants.

## Integrated product capability

```text
Admin setup
  -> Owner creates ProsesBisnis + team
  -> Member authors/submits SOP
  -> Owner Process Review
  -> Dean / relevant Head final approval
  -> contextual TTE
  -> EFFECTIVE + public discovery/verification
  -> optional version replacement or revocation
```

`client/e2e/use-cases.json` maps this product lifecycle into UC01-UC07. Browser E2E is manual/use-case driven and is not a permanent merge gate.

## Evidence

Latest behavior-bearing master head before documentation-only closure: `437f1019d686f6376f45c3becbdd51d658bbf360`.

Green automatic evidence on that exact revision:

- Server CI #681 — PASS: Prisma validate/generate, TypeScript typecheck, complete Jest unit suite.
- Client CI #613 — PASS: production build/route consistency, TypeScript typecheck, complete Vitest suite.

Following closure commits only synchronize repository knowledge/use-case documentation and therefore are G0 under `QUALITY.md`:

- `d5cd979ed56a848ecd522711abb319b97f9375a3` — quality policy aligned with unit-first CI;
- `103d9b3c91eca8f09ba58d213169ef80ec620a2a` — UC01 aligned with Owner self-service ownership;
- `81374a2ccbca49b2af9a4b46e668d57dd14190c7` — README aligned with actual package-manager-independent backend startup.

## Remaining release qualification

No product feature gap is currently identified from the repository's canonical FTI lifecycle.

Before claiming `RELEASE_READY` for the current database/runtime cutover, run once on the current release candidate:

1. **Migration Smoke** — required because the latest behavior change added MariaDB workflow-identity triggers/invariants.
2. **Full FTI Exit** — explicit one-time cutover/release qualification to ensure retired semantics have not re-entered source or target DB invariants.

UC01-UC07 browser E2E is optional diagnostic/release evidence, not a required gate. Run only if browser-level cross-boundary confidence is desired or deterministic lower-layer evidence exposes a gap.

## Current delivery state

`INTEGRATED`.

Do not start another cleanup/refactor milestone unless qualification exposes a real defect. The next meaningful transition is:

```text
Migration Smoke + Full FTI Exit green
  -> RELEASE_READY
  -> authorized release/deploy
```

If the deployment target requires legally recognized government electronic signatures, replacing the current internal P12/CA signing boundary with the applicable PSrE/BSrE integration is a separate production requirement, not part of the completed internal/TA FTI workflow.
