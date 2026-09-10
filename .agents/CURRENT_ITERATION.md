# CURRENT ITERATION

## State

The canonical FTI actor model and deployment runtime are integrated on `master`.

Current actor model:

- identity: `Pengguna` + `PlatformRole`;
- administration: **Administrator Sistem** manages accounts, Departemen, PJ eligibility/scope, and Pejabat Berwenang assignments only;
- authoring: **Penyusun SOP / Anggota Proses Bisnis** exclusively creates and edits SOP;
- coordination: **Penanggung Jawab Proses Bisnis (PJ Penyusun / Process Owner)** creates/manages Proses Bisnis, manages Penyusun, assigns a primary Penyusun to an SOP, performs pemeriksaan, requests revision, or declares the SOP ready to be submitted;
- authority: **Pejabat Berwenang** performs pengesahan and TTE; `FACULTY -> DEAN`, `DEPARTMENT -> relevant HEAD_OF_DEPARTMENT`;
- Peraturan and Pelaksana are global FTI catalogs; active PJ or Anggota may mutate them;
- `PenugasanPenyusunSOP` is coordination metadata, not an authoring ACL;
- `SUPER_ADMIN` remains administration-only and cannot bypass workflow authorization.

## Runtime deployment model

Production startup now has one responsibility per stage:

```text
MariaDB
  -> bootstrap one-shot
       -> safe existing-baseline adoption when required
       -> prisma migrate deploy
       -> seed-if-empty
  -> Backend application
       -> /api/health/ready
  -> Frontend nginx + SSR
       -> /healthz
  -> Public ready
```

Important invariants:

- migrations and seed are not part of backend application startup;
- bootstrap failure stops deployment before backend starts;
- frontend health does not proxy backend/database health;
- frontend starts only after backend readiness is green;
- backend image uses one dependency install followed by production pruning;
- frontend image uses one dependency install, production pruning, and the same `pnpm@11.21.0` declared by the package;
- obsolete backend migration entrypoint and separate Compose Config workflow were removed.

## CI model

Normal automatic evidence is intentionally small:

- **Client CI** — production client build, route-tree consistency, typecheck, Vitest;
- **Server CI** — Prisma validate/generate, production Nest build, typecheck, Jest;
- **Migration Smoke** — only Prisma/migration changes, plus manual invocation;
- **Deployment Smoke** — production Compose contract, image build, full `db -> bootstrap -> backend -> frontend` startup, service health, and failure logs;
- **Full FTI Exit** — manual-only broad cutover qualification.

There is no separate Compose Config gate anymore.

## Verification evidence

Deployment-runtime revision `d91416d7ffe345fcf25ff2f3fd6a63f5950a61f3` completed **Deployment Smoke** successfully:

- production contract validation: green;
- backend/frontend production image build: green;
- production Compose startup to real readiness: green;
- frontend `/healthz`: green;
- proxied backend `/api/health/ready`: green;
- runtime payload check: green.

On the GitHub runner, the cold production Compose startup after image build completed in about **29 seconds**. Image build itself took about **87 seconds** on that clean runner.

Server revision `274b331be44bbf9be4d8c2163ba090e1b6b7191e` completed **Server CI** successfully including production Nest build, typecheck, and Jest.

Subsequent commits only removed obsolete deployment files/workflows and updated repository documentation; they do not change application runtime behavior.

## Current delivery state

`RELEASE_READY_FOR_TARGET_REDEPLOY`.

The next meaningful evidence is a successful MyPaaS deployment of current `master`. If target deployment fails, use the stage owner directly (`bootstrap`, `backend`, or `frontend`) instead of interpreting a transitive frontend-health timeout.
