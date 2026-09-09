# SOPFlow Frontend Skill

Use this skill for frontend work in `client/`. Product semantics and protected-surface rules remain owned by the canonical `.agents` files.

Read the relevant parts of `PROJECT.md`, `ARCHITECTURE.md`, `CURRENT_ITERATION.md`, `CODE_PATTERNS.md`, `QUALITY.md`, and `PROTECTED_SURFACES.md` before changing behavior.

## Stack

```text
React 19
TanStack Start / Router
TanStack Query
TypeScript strict
Tailwind CSS 4
Radix-based local UI primitives
Zustand for genuine shared client state
Vitest + Testing Library
```

Do not add another routing, server-state, form-state, styling, global-state, or acceptance-testing framework without a material need.

## Ownership

```text
client/src/routes       route wiring
client/src/pages        screen/workflow composition
client/src/api          API functions + Query hooks/mutations
client/src/config       query-key ownership
client/src/lib/api      shared transport/response/cache helpers
client/src/components   reusable UI/behavior
client/src/stores       genuine shared client-owned state
client/src/types/dto    frontend API/domain DTOs
```

Put behavior in the narrowest existing owner that can coherently own it.

## Routes

Keep TanStack route files thin. Pages own screen implementations.

When routes change:

- follow existing file-route naming;
- use central route constants where application code references a route;
- run the repository build/route generator;
- commit `client/src/routeTree.gen.ts` when generated output changes;
- never hand-edit generated route output as source code.

## Pages

Pages should:

```text
read auth/context hooks
-> read query hooks
-> derive presentation state
-> compose existing layouts/components
-> call mutations for explicit actions
```

Keep backend authorization authoritative. Frontend capability checks only control discoverability/presentation.

## API + Query Pattern

Use `apiClient`, repository response helpers, centralized query keys, and existing stale-time categories.

Do not scatter raw `fetch` calls through pages/components or create ad-hoc query-key arrays.

Default mutation path is the existing shared mutation helper when its behavior fits. Use custom `useMutation` only for real differences such as optimistic updates or caller-owned error behavior.

Invalidate only the affected cache boundary.

## State

Use TanStack Query for server-owned state:

- entities/lists;
- workflow state;
- authorization context;
- notifications;
- admin configuration.

Use local React state for local interaction state. Use Zustand only for genuinely shared client-owned state.

Do not mirror query data into Zustand by default.

## FTI Capability Model

Visible entry points derive from separate current capabilities:

```text
ProsesBisnis relationship
Pejabat berwenang
Platform role
```

Examples:

- Owner/Member work comes from ProsesBisnis context;
- final approval/TTE comes from contextual authority;
- platform administration comes from `platformRole`.

Do not route current workflow UI through retired global role semantics or add compatibility fallbacks for them.

## SOP Ownership Types

Every current SOP belongs to one ProsesBisnis. Frontend DTOs for current SOP entities should therefore expose a required ProsesBisnis ID unless the endpoint is explicitly returning a different object where process ownership is not applicable.

Do not preserve `string | null` SOP ownership merely for historical fixtures.

## Components / Styling

Prefer existing primitives and semantic design tokens. Search before creating another primitive or variant.

Create a local component when it clarifies one owner. Promote it to shared only when reuse or interaction consistency is real.

Avoid decorative gradients, glow, novelty animation, inconsistent card systems, and abstraction solely to shorten a file.

## User-Facing Vocabulary

Use current FTI product language:

```text
ProsesBisnis
ProsesBisnis Owner
Member
Dekan
Kepala Departemen
Persetujuan
TTE
Pekerjaan SOP
```

Do not expose migration terms, retired OPD/workflow-role names, or internal enum names in normal product UI.

## Protected Edit SOP Workspace

Before touching Edit SOP code, read `.agents/PROTECTED_SURFACES.md`.

Do not modify its observable layout, controls, autosave/edit flow, or copy unless the user explicitly requests an Edit SOP workspace change.

A cleanup elsewhere is not permission to redesign the protected workspace.

## Error / Loading / Empty States

Use explicit states following the nearest existing pattern:

- loading state;
- meaningful `EmptyState`;
- pending state on the initiating action;
- domain errors through existing API/toast helpers.

Do not silently render an empty screen for loading/failure.

## Testing

Protect observable behavior with deterministic repository-owned evidence.

Good frontend tests assert visible content, capability-driven actions, interaction outcomes, link destinations, and material loading/empty states.

Mock stable boundaries such as API hooks/router/stores. Avoid asserting private component decomposition.

Automatic merge gates are the Client CI checks defined in `.agents/QUALITY.md`. Browser E2E remains manual/use-case-driven unless a specific release qualification requires it.

Do not keep skipped tests or no-op compatibility helpers for code paths that no longer exist.

## Implementation Workflow

```text
1. Read product/architecture/protection constraints.
2. Inspect nearest page/API/component pattern.
3. Identify route, transport, server-state, UI-state and presentation owners.
4. Implement the smallest coherent behavior.
5. Reuse existing primitives/query keys/API helpers.
6. Add focused tests when changed risk warrants them.
7. Run build/typecheck/tests required by QUALITY.md.
8. Confirm generated routes/protected surfaces did not drift.
```

## Do Not

- put raw API calls in pages when an API owner exists;
- invent another query-key/state convention;
- copy backend authorization as the sole enforcement;
- reintroduce retired role or unbound-SOP compatibility paths;
- keep no-op exports solely for removed consumers;
- hand-edit generated route files;
- alter the protected Edit SOP workspace without explicit direction;
- add browser/manual acceptance gates as ceremony;
- refactor unrelated UI while delivering a bounded change.
