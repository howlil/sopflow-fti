# DECISIONS

## Current architectural decisions

1. **ProsesBisnis is the canonical SOP ownership boundary.** Active SOPs reference `ProsesBisnis` directly.
2. **Authorization axes are separate.** `PlatformRole` controls platform administration; ProsesBisnis relationships control authoring/review; pejabat berwenang controls final approval/TTE.
3. **Signing authority is contextual.** Faculty -> Dean; Departemen -> its Head. Signing evidence stores that authority.
4. **Lifecycle vocabulary is native.** Persist and expose only `DRAFT`, `PROCESS_REVIEW`, `REVISION_REQUIRED`, `FINAL_APPROVAL`, `TTE_PENDING`, `EFFECTIVE`, `SUPERSEDED`, and `REVOKED`.
5. **Catalogs are global.** Peraturan and Pelaksana are reusable and are not owned by organizational lingkup.
6. **Public archive is ProsesBisnis-first.** Search and navigation use ProsesBisnis/Departemen context.
7. **Migration history is immutable.** Applied SQL can contain historical schema mechanics, but runtime, tests, tooling, and current docs must not depend on them.
8. **No compatibility layer after contraction.** Removed product models are not reintroduced through adapters, fallback DTOs, fixtures, or authorization shortcuts.
