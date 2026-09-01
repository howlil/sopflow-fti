# SOPFlow Frontend Skill

Use this skill for frontend implementation in `client/`. It codifies the patterns already used by SOPFlow so new work looks and behaves like existing code instead of introducing a parallel frontend architecture.

This is a task-specific implementation playbook, not a product specification. Before changing behavior, read the relevant canonical sources in `.agents/`, especially `PROJECT.md`, `ARCHITECTURE.md`, `CURRENT_ITERATION.md`, `CODE_PATTERNS.md`, `QUALITY.md`, and `PROTECTED_SURFACES.md` when applicable.

## Stack

Current frontend stack:

```text
React 19
TanStack Start / Router
TanStack Query
TypeScript strict
Tailwind CSS 4
Radix-based local UI primitives
Zustand for genuine shared client state
Vitest + Testing Library
Playwright for cross-boundary journeys
```

Do not introduce another routing, server-state, form-state, styling, or global-state framework unless the current requirement explicitly justifies a material architecture change.

## Existing Ownership Model

Use this placement model first:

```text
client/src/routes
  -> route definition/wiring only

client/src/pages
  -> screen-level composition and workflow UI

client/src/api
  -> API client functions + TanStack Query hooks/mutations

client/src/config/query-keys.ts
client/src/config/process-query-keys.ts
  -> centralized query keys

client/src/lib/api
  -> shared transport/response/cache helpers

client/src/components/ui
  -> reusable primitives

client/src/components
client/src/hooks
client/src/lib
  -> cohesive reusable behavior that is not owned by one page

client/src/stores
  -> genuine shared client state

client/src/types/dto
  -> API/domain DTO types used by the frontend
```

Default rule: put behavior in the narrowest existing owner that can coherently own it.

## Route Pattern

TanStack file routes should stay thin.

Preferred shape:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { WorkHomePage } from '@/pages/work/WorkHomePage'

export const Route = createFileRoute('/work/')({
  component: WorkHomePage,
})
```

Route files may own route-specific parsing, guards, loaders, or prefetch when needed, but should not become full screen implementations.

When adding or changing routes:

1. follow existing file-route naming/location;
2. use central `ROUTES` constants when application code needs route references;
3. run the repository route generator/build path;
4. commit `client/src/routeTree.gen.ts` when generated output changes;
5. do not hand-edit generated route output as the source of truth.

## Page Pattern

Pages compose existing behavior; they should not become transport/state infrastructure.

Preferred screen shape:

```text
page
  -> read auth/context hooks
  -> read query hooks
  -> derive presentation state
  -> compose layout + local reusable components
  -> call mutation hooks for explicit user actions
```

Example qualities already present in the codebase:

- use `ListPageLayout` / `DetailPageLayout` instead of recreating page chrome;
- use local helper components when they clarify one page without creating a generic abstraction;
- derive counts/capabilities directly from loaded context rather than copying them into local/global state;
- use `useDocumentTitle` for page title behavior;
- use `Link` for navigation rather than imperative navigation when the interaction is fundamentally a link.

Keep business permission truth on the backend. Frontend capability checks are for discoverability/presentation and must not replace server authorization.

## API Module Pattern

Prefer colocating transport functions and their query/mutation hooks in `client/src/api/<domain>.ts` when the module remains cohesive.

Existing shape:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { STALE_TIME } from '@/utils/constants'

export const domainApi = {
  list: () =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<DomainDto[]>>('/domain'),
    ),
}

export function useDomain() {
  return useQuery({
    queryKey: queryKeys.domain,
    queryFn: domainApi.list,
    staleTime: STALE_TIME.MEDIUM,
  })
}
```

Rules:

- use `apiClient`; do not scatter raw `fetch` calls through pages/components;
- unwrap the repository-standard API envelope with `unwrapApiData` / `unwrapApiVoid`;
- type transport responses with existing DTO/envelope types;
- keep query keys centralized;
- use existing `STALE_TIME` categories rather than arbitrary per-hook numbers unless the domain requires it;
- keep HTTP path construction in the API module, not the page;
- expose hooks/use-cases that make page code simple.

For large domains, split transport/query/mutation files only when ownership/readability materially improves, as already done for SOP/evaluation APIs.

## Query Key Pattern

Never create ad hoc arrays repeatedly in screens.

Prefer:

```ts
queryKey: queryKeys.processAdminProcesses
```

or a domain-specific key owner such as `processQueryKeys`.

When adding a query:

1. find the existing key family;
2. add a stable key/factory there;
3. use the same owner for invalidation and cache writes;
4. invalidate the smallest affected ownership boundary.

Avoid `invalidateQueries()` with no useful scope.

## Mutation Pattern

Default to `useMutationWithToast` for ordinary mutations that follow the existing success/error/invalidation UX.

Existing shape:

```ts
const updateProcess = useMutationWithToast({
  mutationFn: ({ processId, payload }) =>
    processAdminApi.updateProcess(processId, payload),
  invalidateKeys: [queryKeys.processAdminProcesses],
  successMessage: 'Process berhasil diperbarui',
  errorMessagePrefix: 'Gagal memperbarui Process',
})
```

Use custom `useMutation` only when the behavior genuinely needs something the shared mutation helper does not model cleanly, such as optimistic updates, unusual multi-step side effects, or caller-owned error presentation.

For caller-owned errors, use the existing suppression/error-handling mechanism rather than creating a second toast system.

Mutation UX rules:

- disable or otherwise guard repeated actions while pending where double submission matters;
- invalidate/cache-update only data affected by the mutation;
- use Indonesian user-facing success/error copy consistent with the surrounding feature;
- do not hide domain errors behind generic success/failure state.

## Server State vs Client State

### TanStack Query

Use for server-owned state:

- entities;
- lists;
- work queues;
- authorization context returned by the server;
- workflow state;
- persisted notifications;
- admin configuration.

### Local React state

Use for local interaction state:

- dialog open/close;
- currently selected row;
- local form draft when not server-owned;
- ephemeral view controls.

### Zustand

Use only for state genuinely shared across screens/layouts that is client-owned, such as existing auth/UI store concerns.

Do not mirror query data into Zustand just to make it globally accessible.

## Contextual Capability Pattern

FTI target screens should derive visible entry points from separate capability dimensions:

```text
Process relationship
Organizational authority
Platform role
```

Do not rebuild target UI around one legacy global `peran` check.

Examples:

- Process Owner/Member work comes from `useMyProcesses()`;
- approval/TTE entry comes from organizational authority hooks;
- platform administration comes from `platformRole`;
- legacy role routing is compatibility fallback only where still required.

Always assume the backend remains the final authorization authority.

## Component Pattern

Create a local component when it makes a screen easier to read and has one clear responsibility.

Promote to shared component only when:

- it is reused or clearly reusable across multiple owners;
- behavior/interaction consistency matters across screens;
- the abstraction has a stable responsibility.

Avoid extracting every JSX block into a component merely to reduce file length.

Prefer existing primitives:

```text
Button
Card
Badge
Dialog / ConfirmDialog
DataSurface
EmptyState
ListPageLayout
DetailPageLayout
```

Search before creating a new primitive or variant.

## Styling Pattern

Use existing semantic tokens/utilities:

```text
bg-background
bg-surface
bg-surface-muted
text-foreground
text-secondary-foreground
text-muted-foreground
border-border
bg-primary-subtle
rounded-control
rounded-surface
shadow-surface
```

Prefer semantic design-system classes over raw palette values.

Keep workflow UI clear, compact, and operational. Do not add decorative gradients, glow, excessive glass effects, novelty animation, or inconsistent cards merely to make a screen look more modern.

Use responsive utilities following nearby screens rather than inventing a new breakpoint system.

## User-Facing Vocabulary

For target FTI surfaces use product language from `PROJECT.md`:

```text
Process
Process Owner
Member
Dekan
Kepala Departemen
Persetujuan
TTE
Pekerjaan SOP
```

Do not expose migration/internal terminology such as `legacy`, `target`, `authoring`, internal enum names, or old evaluator-role semantics unless the surface is explicitly a compatibility/admin/debug surface where that distinction is necessary.

Translate persisted legacy status names into target-facing labels at the presentation/domain mapping boundary instead of renaming database concepts opportunistically.

## Protected Edit SOP Workspace

Before touching any Edit SOP code, read `.agents/PROTECTED_SURFACES.md`.

Default rule: **do not modify its observable layout, UX, editor composition, controls, autosave/edit flow, or copy unless the current user explicitly asks for an Edit SOP workspace change.**

It is allowed to link to the existing workspace from new surrounding navigation/queue surfaces.

Do not use a general vocabulary cleanup or refactor as permission to alter the protected workspace.

## Error / Loading / Empty States

Use explicit states appropriate to the owning screen:

- loading text/spinner/skeleton using existing local pattern;
- `EmptyState` for meaningful empty workflow states;
- mutation pending state on the initiating control;
- domain error handling through API/error helpers and existing toast behavior.

Do not silently render an empty screen when data is loading or failed.

## Testing Pattern

For frontend changes, protect observable behavior.

Preferred tests:

```text
component/page test
  -> visible content
  -> available/hidden action by capability
  -> interaction outcome
  -> link destination
  -> loading/empty state when material
```

Mock at stable external boundaries such as router/API hooks/stores where appropriate. Avoid tests that assert private component decomposition.

When changing route, query, or layout behavior, run the specific tests plus the quality gates required by `.agents/QUALITY.md`.

For critical cross-boundary behavior, use the existing Playwright journey rather than inventing a new browser harness.

## Implementation Workflow

For a frontend task:

```text
1. Read affected product/architecture/protection rules.
2. Inspect the nearest existing page/API/component pattern.
3. Identify the current owner for route, transport, server state, UI state, and presentation.
4. Implement the smallest coherent vertical behavior.
5. Reuse existing primitives, query keys, API helpers, and mutation helpers.
6. Add/update focused observable-behavior tests when warranted.
7. Run focused test + typecheck; add build/router/E2E gates when the changed boundary requires them.
8. Check that generated route output is committed when routes changed.
9. Check that no protected surface changed unintentionally.
```

## Do Not

- put raw API calls inside pages/components when an API owner exists;
- invent a second query-key convention;
- store server state in Zustand by default;
- create a generic design/component system beside the existing one;
- use imperative navigation for ordinary links;
- copy backend authorization logic as the sole permission enforcement;
- propagate legacy OPD/evaluator semantics into new target UI;
- modify generated route files manually as source code;
- alter the protected Edit SOP workspace without explicit user direction;
- refactor unrelated UI while delivering a bounded feature.
