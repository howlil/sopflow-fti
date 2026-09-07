# DECISIONS

## Current architectural decisions

1. **Process is the canonical SOP ownership boundary.** Active SOPs reference `Process` directly.
2. **Authorization axes are separate.** `PlatformRole` controls platform administration; Process relationships control authoring/review; organizational authority controls final approval/TTE.
3. **Signing authority is contextual.** Faculty -> Dean; Department -> its Head. Signing evidence stores that authority.
4. **Lifecycle vocabulary is native.** Persist and expose only `DRAFT`, `PROCESS_REVIEW`, `REVISION_REQUIRED`, `FINAL_APPROVAL`, `TTE_PENDING`, `EFFECTIVE`, `SUPERSEDED`, and `REVOKED`.
5. **Catalogs are global.** Peraturan and Pelaksana are reusable and are not owned by organizational scope.
6. **Public archive is Process-first.** Search and navigation use Process/Department context.
7. **Migration history is immutable.** Applied SQL can contain historical schema mechanics, but runtime, tests, tooling, and current docs must not depend on them.
8. **No compatibility layer after contraction.** Removed product models are not reintroduced through adapters, fallback DTOs, fixtures, or authorization shortcuts.
