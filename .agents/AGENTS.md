# SOPFlow Agent Operating Contract

This file defines the repository-local operating contract for software-engineering agents working on SOPFlow.

Keep responsibilities separated:

- durable product/domain truth -> `PROJECT.md`
- recurring implementation conventions -> `CODE_PATTERNS.md`
- Git/integration behavior -> `GIT_STRATEGY.md`
- commands and verification execution -> `DEVELOPMENT.md`
- active milestone/slice orientation -> `CURRENT_ITERATION.md`

The checkout is the source of truth for implementation state. `PROJECT.md` is the source of truth for approved target FTI semantics when legacy implementation terminology conflicts with the target model.

## Instruction Priority

When instructions conflict, use this order:

1. Current user request.
2. System/harness/tool instructions.
3. Root `AGENTS.md`.
4. `.agents/AGENTS.md`.
5. `.agents/PROJECT.md`.
6. `.agents/CURRENT_ITERATION.md`.
7. `.agents/CODE_PATTERNS.md`.
8. `.agents/GIT_STRATEGY.md`.
9. `.agents/DEVELOPMENT.md`.
10. Source, tests, migrations, package scripts, and README as implementation evidence.

## Canonical Delivery Lifecycle

Use this lifecycle for meaningful product/engineering work:

`USER INTENT -> UNDERSTAND -> BOUND -> MILESTONE PLAN -> EXECUTE SLICES CONTINUOUSLY -> MILESTONE GATE -> RELEASE READY -> STOP`

Canonical principle:

**Plan at milestone boundaries. Execute continuously at slice boundaries. Integrate at logical-change boundaries. Increase the planning horizon, not the integration batch size.**

Work hierarchy:

`Milestone -> Slice -> Logical Change -> Commit`

A milestone is a bounded, meaningful product/engineering/reliability/migration/release outcome worth planning as a whole. A slice is the smallest coherent vertical step that advances the milestone. A logical change is the smallest independently reviewable/integratable repository change inside a slice.

Do not recreate sprint ceremony inside this model. `SPECIFY`, `DESIGN`, `IMPLEMENT`, `VERIFY`, and `QUALITY GATES` remain useful engineering activities inside a slice/logical change when its risk requires them; they are not mandatory global planning checkpoints.

Small or unambiguous tasks may collapse directly into a single logical change.

## Milestone Planning Rule

Plan once when a new meaningful milestone is established. A milestone plan should define only what is needed to execute autonomously:

- WHY / desired outcome;
- in-scope and out-of-scope boundaries;
- material product/architecture/data/security constraints;
- ordered slices;
- milestone-level acceptance/gate conditions;
- known stop conditions or unresolved decisions.

Do not create detailed implementation plans for every slice up front when repository inspection can resolve local details during execution.

Do not reopen planning after every completed slice. Re-plan only when evidence materially changes scope, architecture, risk, ordering, or acceptance conditions.

## Continuous Slice Execution

Once a milestone is approved and bounded:

1. Select the next smallest meaningful slice.
2. Inspect the owning code/contracts.
3. Resolve implementation details autonomously inside approved boundaries.
4. Implement the smallest coherent vertical behavior.
5. Verify the risk boundary.
6. Integrate completed logical changes promptly when gates are green.
7. Update milestone state.
8. Continue to the next approved slice without requiring a new sprint plan.

Stop between slices only when:

- the milestone is complete;
- a material stop condition is reached;
- evidence invalidates the current plan;
- the user changes direction;
- an external dependency prevents useful continuation.

## Authority Split

### User owns

- WHY and WHAT;
- product behavior and scope;
- architecture boundaries;
- acceptance criteria;
- public contracts;
- data ownership;
- security boundaries;
- material technical decisions;
- final release/deploy direction.

### Agent owns

Within approved behavior and boundaries, act autonomously on:

- repository inspection;
- implementation design;
- coding/debugging;
- test selection/execution;
- verification and quality gates;
- implementation-level decisions;
- local refactoring required by the change;
- coherent commits/integration needed to deliver approved logical changes;
- accurate milestone/slice state.

Do not ask for approval for routine implementation decisions or logical-change integration that preserve the already approved milestone boundaries. Do not infer release or production deployment authority from integration.

## Product Authority And Scope

- Do not introduce features, behavior, permissions, requirements, or product decisions not requested or implied by the approved milestone.
- Do not expand scope because of best practice, cleanup, future need, or speculative extensibility.
- Surface missing requirements only when they materially affect observable behavior, contracts, data, permissions, security, ownership, or architecture.
- When requested behavior is clear, implement it without converting routine engineering choices into user decisions.

## Design Decision Rule

Choose the smallest design that satisfies the current requirement while preserving system boundaries.

Preference order:

1. Reuse an existing pattern.
2. Extend the existing owning component/module.
3. Add a small local abstraction.
4. Add a new component/module.
5. Change architecture only when necessary.

Prefer lower coupling, smaller change surface, fewer dependencies/abstractions, lower migration cost, easier reversibility, and clearer ownership.

A material change to service/module boundaries, data ownership, public contracts, security boundaries, communication patterns, consistency model, or infrastructure requires explicit user direction/approval.

## Minimum Change Rule

Implement the smallest coherent vertical slice or logical change that satisfies the current milestone behavior.

- modify only what is required;
- preserve unrelated behavior/files;
- avoid unrelated rename/reorganization/cleanup;
- avoid speculative abstractions and unrelated dependency upgrades;
- reuse existing patterns;
- remove dead code made obsolete by the scoped change;
- keep blast radius proportional to the requirement.

## Stop Conditions

Stop and surface the decision if execution requires:

- behavior that contradicts an approved invariant;
- destructive migration/reset;
- material public-contract change;
- material security-boundary change;
- material data-ownership change;
- material service/module/infrastructure architecture change;
- product semantics that cannot be derived from the approved milestone/domain truth.

Do not use stop conditions for ordinary implementation uncertainty that repository inspection can resolve.

## Feature Compass / Active State

`CURRENT_ITERATION.md` remains the canonical active-work file, but it tracks the **current milestone and slice**, not sprint ceremony.

It should make these facts obvious:

`Milestone Shape -> Current Slice -> Current Position -> Completed Delta -> Evidence -> Next Move`

Keep it compact. Record completed slices and the single next meaningful slice. Do not duplicate `PROJECT.md` or full specifications.

A slice moving to verified/integrated state does not end the milestone. Continue until the milestone gate is satisfied or a stop condition occurs.

## Verification And Quality Gates

Verification targets observable behavior and the changed risk boundary.

Default progression:

1. inspect existing evidence/tests at the owning boundary;
2. add/update the narrowest useful test/evidence when needed;
3. implement the smallest useful change;
4. run focused verification;
5. broaden to typecheck, lint, integration, browser, build, Compose, migration, security, or other gates only when justified by the affected boundary.

High-risk areas include authentication, Process Team authorization, Faculty-vs-Department resolution, final approver authorization, legacy OPD compatibility, TTE credentials/signing, PDF verification, public archive access, persistence invariants, and Prisma migrations. Include negative-path verification when those boundaries change.

Never claim runtime, migration, deployment, PDF/TTE, browser, CI, or end-to-end confidence from unit tests alone.

## Integration Rule

Integration is a delivery activity, not a milestone-level ceremony.

For an approved logical change:

`implement -> focused verification -> relevant gates -> self-review -> integrate -> continue`

Integrate at logical-change boundaries when:

- the change is coherent and independently safe;
- relevant verification is green;
- no stop condition remains;
- integration does not require a new product/material architecture decision.

Do not accumulate multiple verified slices on stacked branches merely to wait for a later merge ceremony.

Release and production deployment remain separate states and require explicit authority/evidence.

## Repository Boundaries

Frontend:

- API transport: `client/src/api`;
- shared API helpers: `client/src/lib/api`;
- reusable UI primitives: `client/src/components/ui`;
- workflow/page behavior: `client/src/pages`;
- route wiring: `client/src/routes`;
- preserve TanStack Router conventions and generated-route workflow.

Backend:

- Nest modules: `server/src/modules`;
- shared cross-cutting behavior: `server/src/common`;
- Prisma schema/migrations: `server/prisma`;
- preserve existing controller/service/repository ownership unless the scoped change deliberately changes ownership.

Legacy terms such as `OPD`, `KEPALA_OPD`, `EVALUATOR`, and `PJ_EVALUATOR` are implementation evidence, not target product concepts. Follow `PROJECT.md` for target FTI semantics.

## Code Quality And Documentation

Optimize for the smallest correct, clear, maintainable change. Code quality supports delivery; it is not a separate ceremony.

Prefer self-explanatory code through naming, types, contracts, and structure. Document WHY, constraints, invariants, compatibility requirements, concurrency assumptions, security-sensitive behavior, and intentional workarounds. Do not add comments that merely narrate clear code.

## Dependencies And OSS

Treat every dependency as operated code outside full project control. Add one only when necessary for the current requirement and proportional to its maintenance/security/runtime/migration cost.

## Feedback Rule

Treat user feedback as new product evidence:

`Delta -> Inspect affected assumptions -> Smallest correction -> Re-verify changed risk -> Update milestone state`

Do not restart the entire milestone or rewrite unrelated work for bounded feedback.

## Retrospective Rule

Run retrospectives only after a milestone/release, significant rework/failure, repeated delivery friction, or explicit request.

Canonical loop:

`Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify`

## Security And Data Integrity

- Never expose/commit real secrets.
- Preserve JWT/TTE/database credential boundaries.
- When touching TTE/PDF behavior, verify hashing, encryption/ciphertext versioning, signing output, authority resolution, effective-state transition, and verification path as relevant.
- When touching contextual access, verify unrelated Process/Faculty/Department denial paths.
- Keep database invariants aligned with `server/prisma/DB-INVARIANTS.md`.

## Final Reporting

For meaningful work, report only decision-useful evidence:

- milestone/slice or behavior changed;
- relevant files/modules;
- exact verification evidence;
- skipped gates/unresolved risks;
- integration state;
- single next meaningful slice/action.

Avoid routine step narration and sprint-style ceremony.
