# SOPFlow Agent Gateway

This is the repository entrypoint for software-engineering and product-engineering work in SOPFlow.

The primary objective is:

> **Meaningful user-outcome improvement with the smallest coherent amount of product and engineering complexity.**

Do not optimize milestone count, sprint count, PR count, commit count, feature count, code volume, test count, documentation volume, or green CI badges as ends in themselves.

## Canonical Repository Sources

For meaningful work, use this authority map:

1. `.agents/PROJECT.md` — **canonical WHY + WHAT**: product purpose, committed behavior, target domain, scope, contracts, ownership semantics, non-goals, and unresolved product questions.
2. `.agents/ARCHITECTURE.md` — **WHERE + HOW boundaries**: system ownership, flows, technical invariants, and material architecture boundaries.
3. `.agents/CURRENT_ITERATION.md` — current repository position, integrated outcome, active authorized work if any, evidence, and next decision/action.
4. `.agents/CODE_PATTERNS.md` — repository-specific implementation conventions.
5. `.agents/QUALITY.md` — risk-proportional verification, CI/gate selection, and release-readiness evidence.
6. `.agents/DECISIONS.md` — durable material decisions and rationale.
7. `.agents/PROTECTED_SURFACES.md` — explicit user-protected product surfaces.

Task-specific implementation skills:

- `.agents/skill/frontend/SKILL.md`
- `.agents/skill/backend/SKILL.md`

Skills encode local implementation patterns only. They do not own product truth, architecture, scope, or current state.

## Authority / Precedence

When sources conflict:

```text
explicit current user instruction
-> PROJECT.md / approved material product decisions
-> ARCHITECTURE.md / protected security-data-design boundaries
-> CURRENT_ITERATION.md
-> CODE_PATTERNS.md / QUALITY.md
-> task-specific implementation skill
-> current code, schema, migrations, tests, CI as evidence of implemented reality
-> historical plans, PR descriptions, stale docs
```

`PROJECT.md` is the canonical target product source of truth. Current code is evidence of **where the migration currently is**, not authority to redefine the target. If code and `PROJECT.md` differ, classify the difference as an implementation/migration gap unless the user explicitly changes product truth.

The user owns product WHY/WHAT, observable behavior, scope, acceptance criteria, public contracts, data/security boundaries, material architecture decisions, destructive migrations, and release/deploy authorization. The agent owns repository inspection, evidence gathering, local implementation design, debugging, risk-proportional verification, and coherent implementation inside those approved boundaries.

Do not silently expand product scope or resolve an open product question through implementation inference.

## Product Direction Before Engineering Work

For non-trivial product work, establish direction before turning gaps into implementation activity:

```text
PRODUCT THESIS
-> PRIMARY USER / CORE JOB
-> CORE JOURNEY
-> PRODUCT STAGE
-> CURRENT BOTTLENECK
-> VALUE EVIDENCE
-> PRODUCT BET
-> SMALLEST COHERENT CHANGE
-> VERIFY
-> INTEGRATE
-> OUTCOME REVIEW
-> STOP / ITERATE / PIVOT
```

A code gap, TODO, old module, failed test, or available capability is not automatically the next product bet.

Milestones and slices are optional planning representations. Use them only when they reduce ambiguity or coordinate a genuinely larger capability. Never create a milestone merely because the previous milestone finished, and never treat milestone percentage as product progress.

## Engineering Lifecycle

For an authorized change, use:

```text
USER INTENT
-> UNDERSTAND
-> BOUND
-> SPECIFY / DESIGN when material
-> IMPLEMENT
-> VERIFY
-> QUALITY GATES
-> RELEASE READY
-> STOP
```

Stages may fuse for small, clear work. Do not add ceremony that does not change correctness, risk, or user outcome.

### Understand / Bound

Before changing code:

- identify the user-visible or operator-visible outcome;
- inspect only the repository boundaries needed to understand ownership, invariants, interfaces, and failure modes;
- identify the current behavior and the delta to `PROJECT.md` or the explicit user request;
- lock scope before implementation;
- surface only ambiguities that materially change behavior, contracts, data ownership, permissions, or architecture.

### Minimum Coherent Change

Prefer the smallest **complete** authorized change that delivers the intended behavior.

This is not synonymous with the smallest diff. A change is too small if it leaves the intended capability unusable, breaks an invariant, or splits one coherent outcome into artificial technical layers.

Default preference:

```text
reuse existing owner/pattern
-> extend locally
-> small local abstraction when justified
-> new component/module only when ownership requires it
-> architecture change only with explicit authorization
```

Avoid unrelated refactors, speculative abstractions, dependency upgrades, future-proofing, architecture fashion, and cleanup that is not required by the approved outcome.

## Current-State Discipline

`.agents/CURRENT_ITERATION.md` is the resumable repository-state document, not a sprint diary.

It must answer:

```text
Target shape
-> Current position
-> Material delta
-> Next meaningful decision/action
```

Keep implementation and delivery states distinct:

```text
IMPLEMENTED
-> VERIFIED
-> INTEGRATED
-> RELEASE_READY
-> RELEASED
-> DEPLOYED
```

Never claim a stronger state than the evidence supports. After work is integrated, remove stale branch/merge instructions. If no next product bet has been authorized, say so instead of inventing one.

## Verification

Verification is selected by changed risk, not by ritual.

Start from the observable behavior or invariant that changed, then use the lowest sufficient deterministic evidence. Escalate only when a material failure mode remains invisible.

Do not require a fixed `unit -> integration -> E2E -> staging` ladder, full-suite execution after every change, browser/manual acceptance, or black-box qualification by default. Use critical golden-path E2E only when it is the lowest useful repository-owned evidence for a material cross-boundary risk.

Detailed gate ownership belongs to `.agents/QUALITY.md`.

For debugging, report and reason in this order when useful:

```text
symptom
-> evidence
-> root cause
-> fix
-> verification
```

Repair implementation defects autonomously when the fix stays inside authorized boundaries. Stop/escalate when the required fix changes a protected contract, data/security boundary, destructive migration strategy, or material architecture.

## Git / Integration

Use branches, PRs, and commits to reduce integration risk and improve reviewability, not as progress metrics.

- prefer one short-lived branch for one coherent change when a branch is useful;
- commits should represent logical changes, not files or arbitrary steps;
- do not create PR/branch ceremony for its own sake;
- do not rewrite shared history or use destructive resets without explicit authorization;
- merging, releasing, and deploying require the applicable user authorization;
- branch-green, merged, release-ready, released, and deployed are different states.

## Completion / Reporting

A change is release-ready only when the approved target behavior is implemented, the relevant golden path and material failure/recovery behavior are sufficiently covered, required risk-selected gates are green, repository state/documentation is truthful, and no material blocker remains.

Report implementation work using only decision-useful information:

```text
Status
User-visible outcome
Evidence
Remaining material gap
```

For audits, use:

```text
Problem
Impact
Recommended Fix
```

Do not enumerate every file, test, command, commit, or ceremony unless it materially helps review or decision-making.

## Repository-Specific Protection

The Edit SOP workspace is a durable protected surface. The exact boundary is owned by `.agents/PROTECTED_SURFACES.md`. Do not modify it unless the user explicitly targets that surface.

## Documentation Rule

One concept has one canonical owner. Update only the document that owns durable truth; remove stale or duplicate guidance rather than creating parallel requirement, architecture, quality, iteration, or process documents.

Historical decisions remain historical evidence. Do not rewrite them merely to make old wording match current terminology.