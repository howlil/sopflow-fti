# SOPFlow Code Patterns

This file is the canonical owner for repository-specific implementation conventions. Product semantics belong in `PROJECT.md`; system boundaries belong in `ARCHITECTURE.md`; verification belongs in `QUALITY.md`.

Prefer the existing local owner/pattern before introducing a new abstraction.

## Core Pattern

Shape code around behavior and ownership:

```text
explicit behavior
-> clear owner
-> explicit boundary
-> smallest implementation
```

Rules:

- prefer explicit code over generic indirection;
- composition over inheritance;
- keep one source of truth for mutable state;
- derive state instead of synchronizing duplicate state;
- validate at trust boundaries;
- do not create generic workflow engines, registries, event buses, base-service hierarchies, repository factories, or plugin systems without a demonstrated current requirement;
- shared `utils` / `helpers` / `common` code needs cohesive ownership;
- split modules/files when ownership, dependency boundary, testability, navigation, or independent changeability improves—not solely because a file is long.

## Backend

Default ownership shape:

```text
Controller
  -> Service
       -> Repository
            -> Prisma
```

### Controller

Own:

- HTTP/transport semantics;
- route/body/parameter extraction;
- authentication context handoff;
- guard/decorator wiring;
- DTO/pipeline validation boundary;
- response/status mapping.

Do not place core workflow policy, contextual authorization, approval resolution, or persistence orchestration in controllers.

### Service

Own:

- use-case orchestration;
- domain/business policy;
- contextual authorization;
- workflow/state transitions;
- coordination of repositories/domain collaborators;
- meaningful conflict/forbidden/invalid-state behavior.

### Repository

Own:

- Prisma queries/persistence details;
- persistence projections/selects;
- persistence-oriented filtering/order;
- atomic persistence helpers.

A business rule may be enforced through a Prisma `where`, but the rule still belongs to the service/domain policy owner.

### DTO / Contracts

Create explicit DTO/schema types at real boundaries:

- external HTTP input/output;
- validation boundary;
- stable cross-module contract with a concrete owner.

Do not duplicate equivalent DTOs across layers for architectural symmetry.

### Transactions

Transaction scope follows one business atomicity boundary.

Use transactions/locking where invariants require them, especially:

- workflow transitions with side effects;
- approval/signing state changes;
- version activation/replacement;
- uniqueness under concurrent writes;
- Process/Process Team ownership mutations that must remain consistent.

Do not broaden transactions around unrelated operations by default.

## FTI Domain Naming

New target-domain code should use the language in `PROJECT.md`.

Preferred concepts include:

```text
Process
ProcessTeam
ProcessOwner
ProcessMember
OrganizationalScope
ProcessReview
FinalApproval
Dean / Dekan
HeadOfDepartment / KepalaDepartemen
```

Legacy concepts such as `OPD`, `KEPALA_OPD`, `PJ_PENYUSUN`, `EVALUATOR`, and `PJ_EVALUATOR` may remain only at compatibility/migration boundaries.

Keep translations between legacy and target concepts explicit rather than scattering legacy conditionals across target modules.

## Authorization Pattern

Authorization checks should answer the exact capability question:

```text
can author this Process SOP?
can review this Process SOP?
can approve this organizational scope?
can sign as the resolved authority?
can administer this platform configuration?
```

Do not answer all of these with one global role check.

For Process-bound access, prefer identifiers/relationships tied to the relevant Process. For final approval/TTE, resolve organizational authority from scope.

## Frontend

### Ownership

```text
client/src/routes
  -> route wiring

client/src/pages
  -> screen/workflow composition

client/src/api
  -> API/domain transport boundary

client/src/components/ui
  -> reusable UI primitives

client/src/components, hooks, lib
  -> cohesive reusable behavior
```

Keep pages focused on composition. Move reusable transport, mapping, or interaction logic to the existing owner rather than growing ad-hoc JSX behavior.

### Server State

Follow the existing TanStack Query direction:

```text
API/domain client
-> query/mutation wrapper
-> centralized query key
-> page/component
```

Rules:

- keep server state in TanStack Query where applicable;
- keep query keys centralized;
- invalidate affected ownership boundaries, not everything by default;
- do not scatter raw fetch calls across pages;
- map transport response shapes at the API/domain boundary.

### Client State

- local UI state stays local;
- Zustand is for genuine shared client state;
- do not mirror TanStack Query state into Zustand without a concrete need;
- derive computed state instead of storing synchronized copies.

### UI

- reuse existing primitives/variants before introducing a parallel component system;
- preserve Tailwind and semantic token conventions;
- keep workflow screens operational and information-dense;
- avoid decorative styling that reduces clarity;
- inspection/preview surfaces must not mutate state unexpectedly;
- do not modify the protected Edit SOP workspace unless the user explicitly targets it; see `PROTECTED_SURFACES.md`.

## Naming

Prefer names that expose domain ownership and behavior.

Examples:

- `ProcessReviewService` over `WorkflowManager` when it only owns Process review;
- `resolveFinalApprover` over `getRole` when resolving approval authority;
- `ProcessTeamRepository` over generic organization persistence when the owner is Process Team.

Avoid vague `Manager`, `Handler`, `Helper`, `Common`, or `Utils` names unless the ownership is actually clear from context.

Boolean names should read as predicates. Commands/actions should use verbs. Domain entities/value types should use nouns.

## Errors / Validation

- validate untrusted input at DTO/schema/boundary layers;
- distinguish not-found, forbidden, conflict, and invalid-state behavior when observable semantics differ;
- do not hide domain failures behind broad catches;
- preserve operationally useful error context without leaking secrets, credentials, ciphertext, raw TTE material, or stack details to clients.

## Prisma / Migrations

- edit canonical Prisma source under `server/prisma`;
- never treat generated Prisma output as a business-logic owner;
- inspect migration SQL when schema changes;
- keep `server/prisma/DB-INVARIANTS.md` aligned with changed database invariants;
- prefer additive/reversible migration steps while legacy compatibility remains;
- do not silently reinterpret or fabricate historical data.

## Refactor Threshold

Refactor only when the current design:

- blocks the requested behavior;
- hides/duplicates a domain invariant;
- creates real drift risk;
- materially enlarges the required change surface;
- makes verification materially harder;
- propagates legacy semantics into a target boundary.

Do not refactor for directory symmetry, aesthetics, hypothetical reuse, or architecture fashion.