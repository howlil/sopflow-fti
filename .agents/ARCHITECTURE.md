# SOPFlow Architecture

This file is the canonical owner for repository architecture: system boundaries, ownership, flows, and technical invariants. Product semantics belong in `PROJECT.md`; active work belongs in `CURRENT_ITERATION.md`; recurring implementation conventions belong in `CODE_PATTERNS.md`; verification policy belongs in `QUALITY.md`; material rationale belongs in `DECISIONS.md`.

## System Shape

SOPFlow is a TypeScript application with two primary runtime packages:

```text
Browser
  -> client/  (React + TanStack Start/Router/Query)
       -> HTTP API
            -> server/  (NestJS)
                 -> Prisma
                      -> MariaDB
```

Root Compose files provide local/runtime orchestration. The repository is not a generic multi-tenant platform; architecture should remain proportional to the FTI product boundary in `PROJECT.md`.

## Frontend Ownership

Primary boundaries:

```text
client/src/routes
  -> route wiring, guards, route parameters, route composition

client/src/pages
  -> screen/workflow composition

client/src/api
  -> transport-facing API clients and query/mutation entry points

client/src/lib/api
  -> shared API infrastructure

client/src/components/ui
  -> reusable UI primitives

client/src/components + client/src/hooks + client/src/lib
  -> cohesive reusable behavior owned outside a single screen

client/src/stores
  -> genuine shared client state only
```

Server state should remain in TanStack Query where applicable. Do not mirror server state into Zustand without a concrete need.

TanStack Router generated output is tracked in `client/src/routeTree.gen.ts`. Route changes must preserve the repository generator workflow and commit the generated tree when it changes.

The Edit SOP workspace is a protected semantic surface. Read `PROTECTED_SURFACES.md` before any change that could affect its observable layout, editor/workbench composition, controls, autosave flow, copy, or interaction behavior.

## Backend Ownership

Primary boundaries:

```text
server/src/modules
  -> domain/use-case modules

server/src/common
  -> cross-cutting infrastructure with real shared ownership

Controller
  -> HTTP/transport boundary

Service
  -> use-case orchestration, domain policy, contextual authorization, state transitions

Repository
  -> Prisma persistence/query details

server/prisma
  -> persistence schema, migrations, database invariants
```

Keep business policy in the owning service/domain boundary even when part of the rule can be expressed in a Prisma query.

Use transactions for one business atomicity boundary, especially workflow transitions, approval/signing transitions, version activation/replacement, and persistence invariants that can race.

## Canonical Domain Boundaries

Authorization dimensions are independent:

```text
Platform Role
  -> SUPER_ADMIN | USER

Process Relationship
  -> PROCESS_OWNER | MEMBER | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

Do not collapse these into one global role model.

Target workflow ownership:

```text
Process Owner / Member
  -> author Process-bound SOP

Process Owner
  -> process review

Organizational Authority
  -> final approval
       FACULTY    -> DEAN
       DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
  -> contextual TTE
  -> publication/effective-state transition
```

`SUPER_ADMIN` owns administration, not workflow bypass.

## Contextual Resolution

Process access must resolve from the SOP's Process relationship, not from legacy global evaluator/penyusun identity.

Final authority must resolve from organizational scope:

```text
FACULTY
  -> active Dean authority

DEPARTMENT
  -> active Head of Department for that department
```

Credential availability and signing authority are separate concerns. A user may be able to configure TTE credentials because they hold a contextual authority even when their legacy account role is unrelated; actual signing permission still comes from the resolved organizational authority.

## Persistence And Migration Boundary

The target model is Process-oriented, while legacy OPD-era schema/contracts remain transitional compatibility seams.

Current migration strategy is additive and reversible where practical:

- preserve historical evidence;
- preserve required legacy/unbound compatibility;
- avoid destructive remapping merely to normalize names;
- prefer explicit adapters/bindings over scattering legacy semantics into new target-domain code;
- treat successfully applied shared migrations as immutable by default;
- add a later corrective migration instead of rewriting shared migration history.

`server/prisma/DB-INVARIANTS.md` remains the detailed database-invariant companion and must stay aligned when persistence invariants change.

## Notification Boundary

Legacy notification persistence is tied to legacy evaluation concepts. Process workflow notifications use separate target-native persistence.

The notification bell may compose both sources into one read model, but persistence/history must remain distinct unless an explicit migration decision changes that contract.

## TTE / PDF Boundary

TTE and signed PDF behavior is security/legal-evidence-sensitive. Keep these concerns explicit:

- credential ownership and storage;
- authority resolution;
- signing transaction/state transition;
- persisted signing evidence;
- published artifact generation;
- public verification path;
- effective-version integrity.

Do not infer end-to-end signing correctness from unit-level service behavior alone.

## Legacy Compatibility Boundary

Legacy concepts such as `OPD`, `PENYUSUN`, `PJ_PENYUSUN`, `EVALUATOR`, `PJ_EVALUATOR`, and `KEPALA_OPD` remain implementation/compatibility evidence, not target product concepts.

Target-facing architecture should not introduce new dependencies on those concepts unless the change is explicitly a compatibility adapter. Legacy routes may remain operable while target Process/authority surfaces become primary.

## Architecture Change Threshold

A change is material and requires explicit user direction when it changes any of these:

- service/module ownership boundary;
- public API/contract semantics;
- data ownership or canonical source of truth;
- authorization/security boundary;
- workflow approval authority;
- consistency/transaction model;
- infrastructure/runtime topology;
- destructive migration strategy.

Routine implementation choices inside these boundaries remain agent-owned.