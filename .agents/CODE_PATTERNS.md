# SOPFlow Code Patterns

Repository-specific implementation conventions for SOPFlow FTI. These patterns describe HOW recurring code should be shaped; product/domain truth remains in `PROJECT.md`, engineering authority/risk rules remain in `AGENTS.md`, and commands/verification remain in `DEVELOPMENT.md`.

Follow an existing local pattern before introducing a new abstraction. During the FTI refactor, preserve useful repository structure while replacing legacy government-domain semantics deliberately rather than mechanically.

## Core Pattern

Organize code by behavior, ownership, and domain boundary before technical directory aesthetics.

Prefer:

`explicit behavior -> clear owner -> explicit boundary -> small implementation`

Avoid framework-within-framework abstractions.

General rules:

- prefer explicit code over generic indirection;
- composition over inheritance;
- keep one source of truth for mutable state;
- derive state instead of storing duplicate state that can drift;
- validate at trust boundaries;
- introduce dependency inversion only for a real external/volatile boundary or demonstrated testing need;
- do not create `Base*`, generic repository/service factories, registries, event buses, plugin systems, wrapper layers, or generic workflow engines without a current demonstrated requirement;
- `utils`, `helpers`, and `common` must not become dumping grounds; shared code needs cohesive ownership;
- split files/modules only when ownership, navigation, dependency boundaries, testability, or independent changeability materially improve;
- do not split solely because a file is long.

## Backend Pattern

Existing repository direction is:

```text
Controller / transport boundary
  -> Service / behavior and policy owner
       -> Repository / persistence boundary
            -> Prisma
```

This pattern is visible in current modules such as the legacy OPD controller/service/repository stack and should be reused where it remains appropriate during the FTI migration.

### Controller

Controller responsibilities:

- HTTP/transport semantics;
- route/parameter/body extraction;
- authentication context extraction;
- guard/decorator wiring;
- validation handoff through DTOs/pipes;
- transport response mapping and status codes;
- Swagger/API metadata where the module already exposes it.

Do not place core workflow policy, persistence queries, approval resolution, Process Team authorization, or state-machine orchestration in controllers.

### Service

Service responsibilities:

- use-case orchestration;
- domain/business policy;
- authorization decisions that depend on domain context;
- workflow/state transition rules;
- coordinating repositories and domain collaborators;
- mapping persistence results into use-case/response models where appropriate;
- throwing meaningful domain/HTTP exceptions at the current repository convention boundary.

For the FTI domain, contextual policy such as Process Team membership, Process Owner review authority, and Faculty-vs-Department approval resolution belongs in an explicit behavior owner rather than being repeated across controllers or queries.

### Repository

Repository responsibilities:

- Prisma persistence/query details;
- reusable persistence projections/selects;
- persistence-oriented filtering/ordering;
- atomic data access helpers;
- returning explicit typed rows when the full persistence model is unnecessary.

Do not move business policy into repositories merely because a rule can be expressed in a Prisma `where` clause. The service/domain behavior owner decides the rule; the repository implements the required persistence operation.

Do not expose Prisma implementation details across unrelated modules when an existing repository boundary already owns them.

### DTO And Contract

Create DTO/schema types at real boundaries:

- external HTTP input/output;
- validation boundary;
- stable cross-module contract where a concrete need exists.

Do not duplicate equivalent DTOs across controller/service/repository layers just to satisfy layering aesthetics.

Prefer explicit response DTOs/domain mappers over anonymous ad-hoc object shapes when the shape is a real contract.

### Transactions And Concurrency

Transaction scope follows one business atomicity boundary.

Use transactions/locks when the invariant requires them, especially for:

- version activation/replacement;
- approval/signing state changes;
- uniqueness under concurrent writes;
- Process/Process Team ownership mutations that must stay consistent;
- other documented database invariants.

Do not wrap unrelated reads/writes in broad transactions by default.

Idempotency is required for genuinely retryable durable/external operations, not every service method.

### Prisma

- `server/prisma/schema.prisma` is the persistence model source.
- generated Prisma client code is never a business-logic source file;
- inspect generated migration SQL for schema changes;
- keep `server/prisma/DB-INVARIANTS.md` aligned with changed persistence invariants.

## FTI Domain Coding Pattern

New target-domain code should use language from `PROJECT.md`.

Preferred concepts:

```text
Process
ProcessTeam
ProcessOwner
ProcessMember
OrganizationalScope
FACULTY
DEPARTMENT
Dean / Dekan authority
HeadOfDepartment / KepalaDepartemen authority
ProcessReview
FinalApproval
```

Legacy terms such as:

```text
OPD
KEPALA_OPD
PJ_PENYUSUN
EVALUATOR
PJ_EVALUATOR
```

may remain temporarily only at compatibility/migration boundaries. Do not propagate them into new target-domain abstractions merely because existing files use them.

Important implementation principles:

- authorization is contextual to Process/Process Team, not a global evaluator identity;
- one Process has exactly one Process Owner and one or more Members;
- process review belongs to that Process Owner;
- final approval is resolved from scope, not manually duplicated on every SOP;
- `FACULTY -> DEKAN`;
- `DEPARTMENT -> relevant KEPALA_DEPARTEMEN`;
- keep approval resolution centralized enough to prevent rule drift, but do not build a generic configurable approval engine;
- organizational unit, process, workflow capability, and final authority remain separate concepts.

When compatibility code must translate old OPD/role structures into the target model, keep that translation at an explicit migration/adapter boundary rather than scattering conditionals throughout the application.

## Frontend Pattern

### Screen Ownership

- routes under `client/src/routes` own routing/wiring;
- pages under `client/src/pages` own screen-level workflow composition;
- reusable cohesive UI behavior belongs in components/hooks;
- reusable primitives belong in `client/src/components/ui`;
- do not split a screen into many tiny files unless reuse, behavior ownership, navigation, or testability improves.

Keep pages thin enough that API transport, shared domain mapping, and reusable interaction logic do not become embedded ad-hoc in JSX.

### Server State

Use the existing TanStack Query direction:

```text
API/domain client
  -> query/mutation wrapper
       -> centralized query key
            -> page/component
```

Current repository patterns include API modules using `apiClient`, response unwrap helpers, centralized `queryKeys`, TanStack Query, and shared mutation helpers.

Rules:

- server state stays in TanStack Query where that pattern already fits;
- query keys remain centralized; do not hand-build unrelated duplicate key conventions;
- mutation invalidation should target affected ownership boundaries rather than invalidating everything by default;
- API transport should remain in `client/src/api` / shared API helpers, not be scattered as raw fetch calls across pages;
- map transport responses at the API/domain boundary rather than leaking transport wrappers through the UI.

### Client State

- local UI state remains local;
- Zustand/shared store is for genuine cross-screen/shared client state, not a default place for every state value;
- derive computed state rather than synchronizing duplicate copies manually;
- do not mirror TanStack Query server state into Zustand without a concrete need.

### UI And Styling

- reuse existing UI primitives and variants before creating parallel component systems;
- Tailwind/current repository styling conventions remain the default;
- use semantic product tokens/utilities before raw palette values when the design system supports them;
- keep operational workflow screens clear and information-dense;
- avoid decorative abstractions and AI-slop styling that do not improve workflow clarity;
- mutation actions should be explicit; preview/inspection surfaces should not unexpectedly mutate state.

## Naming

Use domain language over technical placeholders.

Prefer names that answer what the thing owns or does:

- `ProcessReviewService` over `WorkflowManager` when it only owns process review;
- `resolveFinalApprover` over `getRole` when resolving approval authority;
- `ProcessTeamRepository` over a generic `OrganizationRepository` when ownership is process-team-specific.

Avoid vague names such as `Manager`, `Handler`, `Helper`, `Common`, or `Utils` unless the scope is genuinely clear from the owning module.

Boolean names should read as predicates (`isActive`, `canReview`, `hasAccess`). Commands/actions should use verbs. Domain entities/value types should use nouns.

## Errors And Validation

- validate untrusted input at DTO/schema/boundary layers;
- distinguish not-found, forbidden, conflict, and invalid-state behavior when it affects observable API behavior;
- do not use broad `catch` blocks to hide domain failures;
- preserve error causes/log context where operational diagnosis requires it;
- never leak secrets, credentials, ciphertext, raw TTE material, or internal stack details to client responses.

## Testing Pattern

Tests should protect observable behavior and meaningful invariants.

Prefer:

- focused service/domain tests for workflow policy;
- repository/integration tests for persistence constraints and transaction behavior;
- controller tests when transport/guard/contract behavior is material;
- frontend tests around user-observable interaction/state;
- Playwright for critical cross-boundary journeys.

Avoid tests that only freeze incidental private method structure or implementation trivia.

For FTI authorization changes, include negative cases across unrelated Process Teams and wrong Faculty/Department scope.

## Refactor Threshold

Refactor only when the current design:

- blocks the current requirement;
- hides or duplicates a domain invariant;
- creates duplication with real drift risk;
- creates coupling that materially enlarges the change surface;
- makes verification materially harder;
- preserves legacy OPD/evaluator semantics in a way that conflicts with the approved FTI domain.

Do not refactor for aesthetic consistency, hypothetical future reuse, directory symmetry, or architecture fashion.
