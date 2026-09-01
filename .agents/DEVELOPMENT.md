# SOPFlow Development Guide For Agents

## Setup

Install dependencies separately in each package:

```sh
cd client
pnpm install
```

```sh
cd server
pnpm install
```

Use Docker Compose from the repository root when validating the full stack:

```sh
docker compose --env-file .env config
docker compose --env-file .env up -d
```

## Local Commands

Frontend:

```sh
cd client
pnpm dev
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

Database and Prisma:

```sh
cd server
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
```

Do not run `pnpm db:fresh` unless the user explicitly accepts local database reset.

## Testing Guidance

- Backend Jest root is `server/src`; many focused tests are colocated with modules.
- Backend integration tests intentionally require Docker via `pnpm test:integration:docker`.
- Frontend Vitest tests live under `client/src/**/__tests__` and adjacent `*.test.*` files.
- Playwright business journeys live under `client/e2e`.
- For UI behavior changes, run at least the focused unit test and the relevant Playwright journey when practical.
- For auth, role, OPD, TTE, PDF, notification, or webhook changes, add or run negative-path tests, not only happy-path tests.

## Code Style

- Keep TypeScript strictness intact.
- Prefer explicit DTOs and domain mappers over anonymous ad hoc response shapes.
- Keep validation at DTO/schema/boundary layers.
- Keep repository methods responsible for Prisma persistence details and services responsible for business policy.
- Keep React pages thin enough that reusable behavior stays in components, hooks, `lib`, or API modules.
- Use existing status badge config and role-routing helpers before adding new duplicated label maps.

## Prisma And Migrations

- Edit `server/prisma/schema.prisma` for model changes.
- Add migrations deliberately and inspect SQL before trusting generated output.
- Keep `server/prisma/DB-INVARIANTS.md` aligned when a database invariant changes.
- Regenerate Prisma client after schema changes.
- Avoid editing generated Prisma output directly.

## Runtime Verification Notes

Unit/type/lint success is local code evidence. It is not proof that:

- Docker images build.
- Compose services start.
- MariaDB migrations apply cleanly.
- Public ingress is wired correctly.
- Browser journeys work.
- PDF/TTE artifacts render and verify end to end.

Report exactly which evidence was collected.
