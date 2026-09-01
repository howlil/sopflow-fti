# SOPFlow Agent Instructions

This folder is the repository-local operating guide for coding agents working on SOPFlow.

## Instruction Precedence

When instructions conflict, follow this order:

1. User request in the current conversation.
2. Root `AGENTS.md` and external harness instructions already loaded by the session.
3. `.agents/AGENTS.md`.
4. `.agents/PROJECT.md`.
5. `.agents/CURRENT_ITERATION.md`.
6. `.agents/DEVELOPMENT.md`.
7. Source files, tests, package scripts, and README.

Treat this repository's actual checkout as the source of truth. Re-check files before making claims about current state.

## Project Summary

SOPFlow is a web application for managing Standar Operasional Prosedur documents. The observed stack in this checkout is:

- Frontend: React 19, Vite, TanStack Router, TanStack Query, Zustand, Tailwind CSS 4, Radix UI, lucide-react, Vitest, Playwright.
- Backend: NestJS 11, TypeScript, Prisma 7, MariaDB, Jest.
- Runtime: Docker Compose with `db`, `backend`, and `frontend`; frontend exposes internal port `8080`, backend exposes `3001`, MariaDB uses `3306`.
- Main domains: SOP catalog/procedure/diagram/PDF/public archive, evaluation workflow, TTE profile/signing/verification, and in-app notifications.

## Working Rules

- Inspect before editing. Check relevant files, package scripts, and current runtime assumptions before changing behavior.
- Preserve unrelated files and generated artifacts unless the user explicitly asks to clean them.
- Do not infer permission to commit, merge, push, deploy, or reset state.
- Keep changes narrowly scoped to the requested workflow or bug.
- Prefer existing modules, DTOs, repositories, hooks, query keys, UI primitives, and test utilities over new patterns.
- Do not commit secrets. Root `.env` and `server/.env` may exist locally, but changes to real secret values are out of scope unless explicitly requested.
- Generated Prisma client files under `server/src/generated/prisma` are not the first place to edit. Change Prisma schema/migrations/source code, then regenerate when needed.
- If README references a path that is absent in the checkout, report it as absent instead of assuming the documentation exists.

## Discovery

Use codebase-memory graph tools when they are available in the session. If they are not available, fall back to `rg`, package manifests, and targeted file reads.

Recommended first checks:

```sh
rtk proxy powershell -NoProfile -Command "Get-ChildItem -Force"
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath README.md"
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath client/package.json"
rtk proxy powershell -NoProfile -Command "Get-Content -LiteralPath server/package.json"
```

Use `rg` for source discovery where possible:

```sh
rtk proxy rg "pattern" client/src server/src
rtk proxy rg --files client/src server/src server/prisma
```

## Architecture Boundaries

Frontend:

- Keep API transport in `client/src/api` and shared response/client helpers in `client/src/lib/api`.
- Keep reusable UI primitives in `client/src/components/ui`.
- Keep role/page workflows under `client/src/pages` and route wiring under `client/src/routes`.
- Keep DTO shapes under `client/src/types/dto` and role/status utilities under `client/src/lib` or `client/src/utils`.
- Preserve TanStack Router conventions. Do not hand-edit generated route tree output unless the local workflow requires it.

Backend:

- Keep Nest modules under `server/src/modules`.
- Use the existing controller/service/repository layering for business behavior.
- Keep shared guards, pipes, Prisma utilities, HTTP/security helpers, and status/date utilities under `server/src/common`.
- Keep schema and migrations under `server/prisma`.
- Keep DB invariants aligned with `server/prisma/DB-INVARIANTS.md` when touching persistence behavior.

Domain boundaries:

- SOP behavior belongs in `server/src/modules/sop` and corresponding client `sop` pages/components/API/types.
- Evaluation behavior belongs in `server/src/modules/evaluation` and corresponding client `evaluasi` pages/components/API/types.
- TTE credential, signing, and verification behavior belongs in `server/src/modules/tte` and corresponding client `tte` components/API/types.
- Notification and reminder behavior belongs in `server/src/modules/notifications`; Sprint 1 keeps notification delivery in-app only.

## Delivery Standard

For meaningful code changes, use a small RED -> GREEN -> REFACTOR loop:

1. Add or identify a failing focused test when behavior is changing.
2. Implement the smallest useful slice.
3. Run the narrow relevant test.
4. Broaden verification only when the risk boundary requires it.

Do not report browser/runtime/deployment confidence from unit tests alone.

## Verification Menu

Frontend:

```sh
cd client
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e:critical
```

Backend:

```sh
cd server
pnpm typecheck
pnpm lint
pnpm test
pnpm test:core-unit
pnpm test:integration:docker
```

Compose/runtime:

```sh
docker compose --env-file .env config
docker compose --env-file .env build
docker compose --env-file .env up -d
docker compose --env-file .env ps
docker compose --env-file .env logs -f frontend backend
```

Use focused tests for narrow changes and disclose unrun gates in the final response.

## Frontend UX Direction

- Build the usable workflow screen first, not a marketing shell.
- Keep operational screens dense, clear, and role-oriented.
- Prefer existing UI primitives and lucide-react icons.
- Avoid generic decorative gradients, oversized cards, and AI-styled filler copy.
- For SOP authoring, prefer a preview-centered workbench and contextual editing over a tall wizard.
- Ensure mobile and desktop layouts do not overlap, truncate critical text, or shift unexpectedly.

## Security And Data Integrity

- Treat authentication, role access, OPD ownership, TTE credentials, PDF signing, public archive access, notifications, and Prisma migrations as high-risk areas.
- Preserve credential boundaries: JWT secrets, TTE encryption secret, and database credentials must not be exposed in client code or committed.
- When touching TTE/PDF code, verify PIN hashing, P12 passphrase encryption, versioned ciphertext, signing output, and verification paths.
- When touching multi-role data access, add tests for cross-role and cross-OPD denial cases.

## Reporting

Final reports should include:

- Files changed.
- Verification run and exact result.
- Any skipped gates or assumptions.
- Whether the change is local only, committed, pushed, deployed, or not.
