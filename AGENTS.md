# SOPFlow Agent Gateway

This is the thin, agent-agnostic entrypoint for software-engineering work in this repository.

Global canonical SWE instructions remain the primary operating reference and are **not duplicated here**. This file only maps those rules onto SOPFlow's repository knowledge, authority boundaries, active state, and task-specific implementation skills.

## Canonical Repository Sources

Default reading order for meaningful work:

1. `.agents/PROJECT.md` — **WHY + WHAT**: product behavior, scope, contracts, ownership, non-goals, open product questions.
2. `.agents/ARCHITECTURE.md` — **WHERE + HOW boundaries**: system ownership, flows, technical invariants, material architecture boundaries.
3. `.agents/CURRENT_ITERATION.md` — active milestone/slice, Feature Compass, evidence, blockers, next action.
4. `.agents/CODE_PATTERNS.md` — repository-specific implementation conventions.
5. `.agents/QUALITY.md` — verification strategy, checks, CI/migration gates, release-readiness evidence.
6. `.agents/DECISIONS.md` — durable material decisions and rationale.

Optional repository overrides exist only when there is a concrete durable need. Currently:

- `.agents/PROTECTED_SURFACES.md` — explicit user-protected product surfaces.

Read only the sources relevant to the affected boundary, but **always inspect `CURRENT_ITERATION.md` when continuing active work**. Read `PROTECTED_SURFACES.md` before any change that can affect a listed surface.

## Task-Specific Skills

Use the implementation skill that matches the code being changed:

- `.agents/skill/frontend/SKILL.md` — frontend implementation using existing React/TanStack/API/query/UI/testing patterns.
- `.agents/skill/backend/SKILL.md` — backend implementation using existing NestJS/service/repository/Prisma/authorization/transaction/testing patterns.

These skills are derived from the existing codebase and exist to keep implementation consistent. They do not override `PROJECT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PROTECTED_SURFACES.md`, or the current user instruction.

For a cross-stack vertical slice, read both skills, but keep behavior ownership on the correct side of the API boundary instead of duplicating policy in frontend and backend.

## Authority / Precedence

When repository sources conflict, use:

```text
explicit current user instruction
-> PROJECT.md / approved material decisions
-> ARCHITECTURE.md / applicable protected or security/design override
-> CURRENT_ITERATION.md
-> CODE_PATTERNS.md / QUALITY.md
-> task-specific skill for the affected implementation boundary
-> current code, tests, migrations, CI, package scripts as implementation evidence
-> historical plans, PR descriptions, stale docs
```

One concept should have one canonical owner. Do not create parallel requirement, design, iteration-state, testing, Git-strategy, or development-rule documents when the content belongs to an existing canonical owner.

## Operating Model

Optimize for high user value, high product-capability density, correctness, and maintainability while minimizing user-outcome lead time, rework, waiting, verification waste, planning overhead, and integration ceremony.

For meaningful product work, use:

`USER INTENT -> UNDERSTAND -> BOUND -> MILESTONE PLAN -> EXECUTE SLICES CONTINUOUSLY -> MILESTONE GATE -> RELEASE READY -> STOP`

Small or unambiguous work may fuse stages. Planning is performed at the milestone boundary, not restarted between already-approved slices.

For milestone work:

- define one bounded capability/outcome that is meaningful to a user or operator;
- decompose it into the fewest coherent vertical slices needed to reach that outcome;
- execute approved slices continuously without sprint re-activation or repeated planning ceremony;
- integrate at logical-change boundaries when useful, but do not turn each tiny implementation step into its own branch/PR/milestone;
- prefer complete cross-boundary capability over horizontal layer completion;
- stop when the approved milestone outcome is complete and sufficiently verified.

The user owns product behavior/scope, public contracts, data ownership, security boundaries, material architecture decisions, and release/deploy direction. The agent owns routine implementation decisions inside those approved boundaries.

## Minimum Complete Change

Prefer the **smallest complete authorized implementation that delivers the intended capability**.

This does **not** mean the smallest diff, fewest files, or smallest possible slice. A change is too small when it leaves the approved behavior unusable, non-demonstrable, dependent on another artificial planning cycle, or split only by technical layers.

Modify only what the complete capability requires. Reuse existing ownership and patterns first. Do not expand scope for unrelated cleanup, speculative abstraction, dependency upgrades, future-proofing, or nice-to-have product expansion.

Stop/escalate for material ambiguity or a required destructive migration, public-contract change, security/privacy/data-ownership change, material architecture change, or conflict with an approved product invariant/protected surface.

## Active-State Rule

`CURRENT_ITERATION.md` is the canonical resumable state for active meaningful work.

Keep it compact and current using:

`Shape -> Position -> Delta -> Next Move`

Its state must describe repository reality, not the intention from an earlier branch or PR. Never leave instructions such as `integrate Mx` after that milestone is already integrated.

Keep these states distinct and update them when reality changes:

`ACTIVE -> IMPLEMENTED -> VERIFIED -> INTEGRATED -> RELEASE_READY -> RELEASED -> DEPLOYED`

A milestone may carry more than one dimension when useful, for example `IMPLEMENTED / VERIFICATION_PENDING`, but must not claim a stronger state than the evidence proves.

After integration, `master` must identify the integrated milestone/state and the next meaningful capability instead of preserving stale pre-merge instructions. Record only evidence and blockers needed for another agent to continue without conversation history; do not turn the file into a changelog or sprint archive.

## Verification Boundary

Verification is risk-selected, not ceremony-selected.

Use the cheapest, fastest evidence that can actually prove the changed behavior, then escalate only when a material failure mode remains invisible. Do not automatically execute a fixed `unit -> integration -> E2E -> staging` ladder.

For browser journeys, new/changed capability journeys are primary evidence. Add older regression journeys only when their protected boundary can plausibly be affected. Full historical E2E is reserved for a justified milestone/release gate, shared harness/infrastructure changes, or broad cross-cutting risk; it must not grow cumulatively by default merely because new journey IDs exist.

Detailed repository-specific evidence rules remain owned by `.agents/QUALITY.md`.

## Repository-Specific Protection

The Edit SOP workspace is currently a durable protected surface. The exact semantic boundary is owned only by `.agents/PROTECTED_SURFACES.md`; do not copy or weaken that rule elsewhere.

## Documentation Rule

Update only the canonical owner affected by durable change. Remove stale/duplicate repository guidance rather than preserving conflicting history.

Task-specific implementation skills may exist under `.agents/skill/` when they encode recurring codebase-specific execution patterns. Do not use skills as parallel product specs, architecture docs, or iteration state.