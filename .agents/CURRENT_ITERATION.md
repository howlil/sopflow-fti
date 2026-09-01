# Current Iteration

Iteration: Sprint 1
Delivery State: IMPLEMENTED_LOCAL
Created: 2026-09-01

## Feature Shape

Remove Wago/WhatsApp notification transport integration and keep notification delivery in-app only.

## Current Position

`IMPLEMENT -> VERIFY -> QUALITY GATES`

The scoped implementation is recorded as complete locally. Verification evidence exists for the affected server/client/config boundaries; no release or deployment is recorded here.

## Delta

- Wago/WhatsApp transport is removed from the Sprint 1 notification path.
- Notification delivery remains in-app only.
- Repository agent guidance now uses the canonical SWE lifecycle, authority split, minimum-change rule, stop conditions, Feature Compass, evidence-driven quality gates, and lean retrospective model.

## Evidence

Recorded verification for Sprint 1:

- `server`: Prisma generate and validate passed.
- `server`: typecheck passed.
- `server`: focused env/notification tests passed.
- `server`: targeted ESLint on touched files passed.
- `client`: typecheck passed.
- `root`: `docker compose --env-file .env config --quiet` passed.

Known unrelated condition:

- Full backend lint still has pre-existing violations outside Sprint 1 scope.

## Next Move

For the product iteration, inspect any remaining scope-specific risk and move to `RELEASE READY` only when the available evidence is sufficient. Release/deploy remains a separate action and must not be inferred from implementation completion.

## Tracking Rules

- This file is an orientation layer, not a second development lifecycle.
- Keep it compact: `Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`.
- Update it when meaningful work changes the state of this tracked iteration.
- Do not create or rename a product iteration unless user intent establishes that scope.
- The agent may advance engineering position through IMPLEMENT, VERIFY, QUALITY GATES, and RELEASE READY when evidence supports it.
- Never mark work RELEASED or DEPLOYED without evidence that the action actually occurred.
