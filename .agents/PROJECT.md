# SOPFlow Project Profile

## Purpose

SOPFlow supports management, evaluation, publication, and verification of SOP documents for an Indonesian government-style organization context.

## Observed Runtime

The root Compose file defines:

- `db`: MariaDB 11.4 with persistent `db_data`.
- `backend`: NestJS service built from `server/Dockerfile`, internal port `3001`, runs Prisma migrations and initial seed before `pnpm start:prod`.
- `frontend`: Vite/React production server behind Nginx-style frontend image, internal port `8080`, depends on backend readiness.
- `sop_pdf_data`: persistent PDF artifact volume mounted at `/app/storage/sop-pdf`.

Public ingress should normally target the frontend service only. Backend and database are internal runtime services unless deployment infrastructure explicitly says otherwise.

## Frontend Map

- `client/src/routes`: TanStack Router file routes.
- `client/src/pages`: role and workflow pages.
- `client/src/components`: shared and domain-specific React components.
- `client/src/components/ui`: reusable UI primitives.
- `client/src/api`: endpoint wrappers and domain API modules.
- `client/src/lib`: domain helpers, mappers, print/PDF helpers, query helpers, status config.
- `client/src/stores`: Zustand stores.
- `client/e2e`: Playwright journeys and business-flow coverage.

Important role/workflow areas:

- `pages/penyusun`: SOP authoring, procedure data, regulations, personnel.
- `pages/kepala-opd`: SOP and evaluation submission approval flows.
- `pages/evaluator` and `pages/pj-evaluator`: evaluation workflows, evaluator assignment, scoring, graphs.
- `pages/public` and `pages/validasi`: public archive and PDF/TTE validation.

## Backend Map

- `server/src/main.ts`: Nest bootstrap.
- `server/src/app.module.ts`: module composition.
- `server/src/common`: shared auth, guards, HTTP security, Prisma, pagination, status, date, logging.
- `server/src/modules/core`: auth, user/role/OPD/person master data.
- `server/src/modules/sop`: SOP catalog, procedure, diagram, PDF artifacts, public access, collaboration logs.
- `server/src/modules/evaluation`: submissions, detail/workspace, scoring, feedback, graphs.
- `server/src/modules/tte`: TTE profile, signing, verification, shared credential handling.
- `server/src/modules/notifications`: in-app notifications and reminder reconciliation.
- `server/prisma`: Prisma schema, migrations, seed, and database invariant notes.

## Package Managers

Both `client/package.json` and `server/package.json` declare `pnpm@11.21.0`. Prefer `pnpm` inside the relevant package directory.

## Environment

Root `.env` is used by Compose. Backend also has `server/.env` and `server/.env.test` in this checkout. Treat any existing env file as local state; do not expose values in responses.

Required production-style values include:

- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `TTE_ENCRYPTION_SECRET`
- `PUBLIC_APP_ORIGIN`

## Known Checkout Notes

- The root was not a Git repository when this `.agents` folder was created.
- README references `docs/*`, but no root `docs` folder was present at creation time.
- `client/playwright-report` and `client/test-results` exist locally and may be generated artifacts.
- Sprint 1 removes Wago/WhatsApp transport integration and keeps notifications in-app only.
