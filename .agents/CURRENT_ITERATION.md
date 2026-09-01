# Current Iteration

Iteration: Sprint 1
Status: IMPLEMENTED_LOCAL
Created: 2026-09-01

Scope: remove Wago/WhatsApp transport integration and keep notification delivery in-app only.

## Rules

- Do not start a new iteration, rename an iteration, or mark delivery complete without an explicit user request.
- If the user asks for current state or next step, inspect the actual checkout first.
- If work is requested, scope it from the user's current request and update this file only when the user asks for iteration tracking.

## Current Setup Task

Sprint 1 was opened by user request on 2026-09-01.

## Local Verification

- `server`: Prisma generate and validate passed.
- `server`: typecheck passed.
- `server`: focused env/notification tests passed.
- `server`: targeted ESLint on touched files passed.
- `client`: typecheck passed.
- `root`: `docker compose --env-file .env config --quiet` passed.

Full backend lint still has pre-existing unrelated violations outside Sprint 1 scope.
