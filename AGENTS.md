# SOPFlow Agent Gateway

This is the thin, agent-agnostic entrypoint for software-engineering work in this repository.

Global canonical SWE instructions remain the primary operating reference and are **not duplicated here**. This file only maps those rules onto SOPFlow's repository knowledge, authority boundaries, and active state.

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

## Authority / Precedence

When repository sources conflict, use:

```text
explicit current user instruction
-> PROJECT.md / approved material decisions
-> ARCHITECTURE.md / applicable protected or security/design override
-> CURRENT_ITERATION.md
-> CODE_PATTERNS.md / QUALITY.md
-> current code, tests, migrations, CI, package scripts as implementation evidence
-> historical plans, PR descriptions, stale docs
```

One concept should have one canonical owner. Do not create parallel requirement, design, iteration-state, testing, Git-strategy, or development-rule documents when the content belongs to an existing canonical owner.

## Operating Boundary

Use the canonical SWE lifecycle:

`USER INTENT -> UNDERSTAND -> BOUND -> SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> QUALITY GATES -> RELEASE READY -> STOP`

Small/unambiguous work may fuse stages.

For milestone work:

- plan at milestone boundaries;
- execute approved slices continuously;
- integrate at logical-change boundaries;
- prefer vertical capability over horizontal layer completion;
- do not restart sprint/planning ceremony between already-approved slices.

The user owns product behavior/scope, public contracts, data ownership, security boundaries, material architecture decisions, and release/deploy direction. The agent owns routine implementation decisions inside those approved boundaries.

Prefer the smallest coherent change and existing ownership/patterns. Do not expand scope for cleanup, speculative abstraction, dependency upgrades, or future-proofing.

Stop/escalate for material ambiguity or a required destructive migration, public-contract change, security/privacy/data-ownership change, material architecture change, or conflict with an approved product invariant/protected surface.

## Active-State Rule

`CURRENT_ITERATION.md` is the canonical resumable state for active meaningful work.

Keep it compact and current using:

`Shape -> Position -> Delta -> Next Move`

Record evidence and blockers needed for another agent to continue without conversation history. Do not turn it into a changelog, sprint archive, or duplicated specification.

## Delivery State

Keep these states distinct:

`implemented != verified != integrated != release-ready != released != deployed`

Relevant verification and mandatory gates may establish `release-ready`. Release and production deployment require explicit user authority and corresponding environment evidence.

## Repository-Specific Protection

The Edit SOP workspace is currently a durable protected surface. The exact semantic boundary is owned only by `.agents/PROTECTED_SURFACES.md`; do not copy or weaken that rule elsewhere.

## Documentation Rule

Update only the canonical owner affected by durable change. Remove stale/duplicate repository guidance rather than preserving conflicting history.

Do not add persistent task plans or extra `.agents/*.md` files unless a concrete durable repository complexity cannot fit one of the canonical owners.