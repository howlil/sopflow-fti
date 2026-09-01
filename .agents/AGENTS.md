# SOPFlow Agent Operating Contract

This file is the repository-local operating contract for software-engineering agents working on SOPFlow. Keep it lean: durable project/domain facts belong in `PROJECT.md`, commands and verification details in `DEVELOPMENT.md`, and live iteration state in `CURRENT_ITERATION.md`.

## Instruction And State Sources

When instructions conflict, follow this order:

1. User request in the current conversation.
2. System, harness, and tool instructions loaded by the session.
3. Root `AGENTS.md` if one exists in the current checkout.
4. `.agents/AGENTS.md`.
5. `.agents/PROJECT.md` for durable product/domain facts and architecture boundaries.
6. `.agents/CURRENT_ITERATION.md` for active scope and iteration state.
7. `.agents/DEVELOPMENT.md` for commands, setup, and verification details.
8. Source files, tests, package scripts, migrations, and README as implementation evidence.

The actual checkout is the source of truth for current implementation state. `PROJECT.md` is the source of truth for the approved target FTI domain when legacy implementation terminology conflicts with the target model.

## Canonical Engineering Lifecycle

Use this lifecycle as the default orientation model:

`USER INTENT -> UNDERSTAND -> BOUND -> SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> QUALITY GATES -> RELEASE READY -> STOP`

Stages may be fused for small and unambiguous tasks. The lifecycle is an orientation model, not mandatory ceremony.

Do not skip a stage when doing so would hide a material product, architecture, security, data, contract, or verification decision.

Default execution shape:

`Problem -> Required Behavior/Contract -> Smallest Vertical Slice -> Implementation -> Evidence -> Next Move`

Do not turn this into mandatory documents, tickets, or ceremonies when the task is already clear.

## Authority Split

### User owns

- WHY and WHAT.
- Product behavior and scope.
- Architecture boundaries.
- Acceptance criteria.
- Public contracts.
- Data ownership.
- Security boundaries.
- Material technical decisions.
- Final approve/reject/change-direction decisions.
- Merge, release, and production deployment decisions when material to delivery.

### Agent owns

Within approved behavior and boundaries, act autonomously on:

- Repository inspection and targeted discovery.
- Implementation design inside approved boundaries.
- Coding and debugging.
- Test selection and execution.
- Verification and quality gates.
- Implementation-level decisions.
- Local refactoring required by the requested change.
- Maintaining accurate implementation evidence and iteration orientation.

Do not ask for approval for routine implementation choices that preserve approved behavior, contracts, ownership, and architecture boundaries.

## Product Authority And Scope

- Do not introduce features, behavior, permissions, requirements, or product decisions the user did not request.
- Do not expand scope because of best practice, optimization, cleanup, future need, or speculative extensibility.
- If a missing requirement would materially change observable behavior, data, public contracts, permissions, security, ownership, or architecture, surface it instead of guessing.
- If the requested behavior is clear, implement it without turning routine engineering choices into user decisions.
- User-owned acceptance criteria do not require formal ceremony. When explicit acceptance criteria are absent but requested behavior is clear, verify against that observable behavior and existing contracts rather than inventing new product requirements.

## Understand, Bound, And Specify

Before meaningful implementation, establish only what is necessary to avoid wrong work:

1. What observable behavior must change?
2. What must remain unchanged?
3. Which existing component/module owns that behavior?
4. Which public/data/security/architecture boundaries are affected?
5. What evidence will demonstrate the requested behavior works?

Prefer inspecting existing code and contracts over writing speculative specifications.

For cross-boundary features, align the relevant contract before independently changing frontend/backend behavior. Contract-first means shared behavior is explicit before both sides improvise; it does not require a new abstraction or design document for every task.

## Design Decision Rule

Choose the smallest design that satisfies the current requirement while preserving existing system boundaries.

Determine:

1. What behavior must change?
2. Which existing component owns it?
3. Can the change use the current architecture and patterns?
4. What design has the smallest justified blast radius?

Preference order:

1. Reuse an existing pattern.
2. Extend the existing owning component/module.
3. Add a small local abstraction.
4. Add a new component/module.
5. Change architecture only when necessary.

Prefer lower coupling, smaller change surface, fewer new dependencies/abstractions, lower migration cost, easier reversibility, and clearer ownership.

A material change to service/module boundaries, data ownership, public contracts, security boundaries, communication patterns, consistency model, or infrastructure requires explicit user direction/approval.

## Minimum Change Rule

Implement the smallest coherent vertical slice that satisfies the requested behavior.

Guardrails:

- Modify only what the requirement needs.
- Preserve unrelated behavior and files.
- Do not rename unrelated symbols.
- Do not reorganize unrelated files or directories.
- Do not clean adjacent code merely because it is visible.
- Do not add speculative abstractions or future-proof extension points.
- Do not upgrade unrelated dependencies.
- Do not change unrelated observable behavior.
- Reuse existing patterns before introducing architecture.
- Remove dead code directly created or made obsolete by the requested change.
- Keep change surface proportional to the requirement.

Prefer a vertical slice that produces observable behavior over building horizontal layers that are not yet usable.

## Repository Boundaries

Use `.agents/PROJECT.md` as the durable repository and target-domain map. Preserve these high-level ownership rules unless the user explicitly changes them.

Frontend:

- API transport belongs in `client/src/api`; shared API helpers belong in `client/src/lib/api`.
- Reusable UI primitives belong in `client/src/components/ui`.
- Workflow/page behavior belongs under `client/src/pages`; route wiring belongs under `client/src/routes`.
- Preserve TanStack Router conventions and avoid hand-editing generated route output unless the local workflow requires it.

Backend:

- Nest modules belong under `server/src/modules`.
- Preserve existing controller/service/repository ownership for business behavior and persistence unless the scoped refactor deliberately moves that ownership.
- Shared cross-cutting behavior belongs under `server/src/common`.
- Prisma schema and migrations belong under `server/prisma`.
- Do not edit generated Prisma client output as the source change.

Existing implementation modules:

- SOP: `server/src/modules/sop` and corresponding client SOP surfaces.
- Legacy evaluation/review implementation: `server/src/modules/evaluation` and corresponding client surfaces. Treat `PROJECT.md` as canonical for the target process-review model; do not preserve centralized evaluator semantics merely because this module exists.
- TTE: `server/src/modules/tte` and corresponding client TTE surfaces.
- Notifications: `server/src/modules/notifications`.

During the FTI refactor, legacy names such as `OPD`, `KEPALA_OPD`, `EVALUATOR`, and `PJ_EVALUATOR` are implementation evidence, not automatically target product concepts. Do not perform blind terminology replacement; follow the conceptual migration rules in `PROJECT.md`.

## Stop Conditions

Stop implementation and surface the decision when any of these becomes necessary:

- The request contradicts existing required behavior or an approved product invariant.
- A destructive migration or destructive state reset is required.
- A public contract must materially change.
- A security boundary must materially change.
- Data ownership must materially change.
- Service/module boundaries, communication patterns, consistency model, or infrastructure require a material architecture change.

Do not use stop conditions for normal implementation uncertainty that can be resolved by inspecting the repository.

## Repository Mutation And Release Boundary

A user request to implement, fix, refactor, or align repository content authorizes the file edits and tool-required commits necessary to perform that requested change.

Do not infer permission for destructive reset, merge, production deployment, or release unless the user requests it or the execution environment explicitly defines that action as part of the requested operation.

`RELEASE READY` means verification evidence is sufficient for the requested scope. It does not mean the product has been released or deployed.

## Feature Compass

Use `CURRENT_ITERATION.md` as a compact orientation layer for meaningful tracked work. It should make these facts obvious without reconstructing conversation history:

`Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`

Rules:

- Keep it compact; do not duplicate the full specification or `PROJECT.md`.
- Update it when meaningful work changes the state of an existing tracked iteration.
- Do not create or rename a product iteration without user intent establishing that scope.
- The agent may move the recorded engineering position through IMPLEMENT, VERIFY, QUALITY GATES, and RELEASE READY when evidence supports it.
- Do not mark work RELEASED or DEPLOYED without actual evidence.
- Do not force iteration tracking for trivial edits where it adds no orientation value.
- Always keep the single next meaningful action obvious when an iteration remains active.

## Feedback And Iteration Rule

Treat user feedback as new product evidence, not as a reason to defend the previous implementation.

When the user changes or corrects direction:

1. Identify the delta from the currently approved behavior.
2. Inspect the affected implementation/domain assumptions.
3. Apply the smallest coherent correction.
4. Re-verify the changed risk boundary.
5. Update `PROJECT.md` only for durable product/domain truth and `CURRENT_ITERATION.md` only for live iteration state.

Do not rewrite unrelated work or restart the entire lifecycle when the feedback is a bounded correction.

## Verification And Quality Gates

Verification must target observable behavior and the risk boundary of the change.

Default progression:

1. Inspect existing evidence/tests at the owning boundary.
2. Add or update the narrowest useful test/evidence when needed.
3. Implement the smallest useful slice.
4. Run focused verification.
5. Broaden to typecheck, lint, integration, browser, build, Compose, migration, or other gates only when the affected boundary justifies it.

Test-first is useful when it clarifies behavior or prevents a regression, but do not force RED -> GREEN ceremony when another verification path is faster and equally reliable.

Test observable behavior and contracts rather than implementation trivia. Avoid tests whose only purpose is freezing an incidental internal structure.

Never claim browser, runtime, migration, deployment, PDF/TTE, or end-to-end confidence from unit tests alone. Use `.agents/DEVELOPMENT.md` for available commands and report skipped gates explicitly.

High-risk areas include authentication, Process Team membership/authorization, Faculty-vs-Department scope resolution, final-approver authorization, legacy OPD migration boundaries, TTE credentials, PDF signing/verification, public archive access, notifications, persistence invariants, and Prisma migrations. Include negative-path verification when those boundaries change.

## Code Quality

Optimize for the smallest correct, clear, maintainable change. Code quality supports delivery; it is not a separate ceremony.

Core invariants:

- Preserve required behavior.
- Keep ownership clear.
- Keep dependencies intentional.
- Follow repository conventions.
- Prefer the simplest reasonable design.
- Avoid unnecessary abstractions/dependencies.
- Avoid unrelated refactoring.
- Remove dead code made obsolete by the change.
- Keep change surface proportional to the requirement.

Organize code by behavior and ownership before directory aesthetics. Split files/modules only when it improves ownership, navigation, dependency boundaries, or independent changeability. Avoid arbitrary line-count splitting and dumping grounds such as generic `utils`, `helpers`, or `common` without clear ownership.

## Code Documentation

Prefer self-explanatory code through naming, types, contracts, and structure.

Document WHY, constraints, invariants, non-obvious behavior, compatibility requirements, concurrency assumptions, consistency guarantees, security-sensitive behavior, dangerous operational behavior, and intentional workarounds.

Do not add comments that merely translate clear code into prose.

Preference order:

`clear code -> types/contracts -> focused comment -> module/package docs -> ADR for durable architecture decisions`

Keep documentation close to the source of truth. Update docs with behavior changes in the same change and delete stale documentation made obsolete by that change.

## Dependencies And OSS

Treat every dependency as code the project operates but does not fully control.

Before adding one, determine:

- Is it necessary for the current requirement?
- Can existing platform/repository capabilities solve the problem reasonably?
- Is its scope proportional to the feature?
- What maintenance, security, compatibility, runtime, and migration cost does it introduce?

Do not add a dependency merely to save a small amount of local code when the long-term operated surface is larger than the benefit.

## Retrospective Rule

Do not run a retrospective after every small change.

Use one after a sprint/release, significant rework or failure, repeated delivery friction, or an explicit user request. Base it on observable evidence such as requirement churn, diff/rework, failed tests/CI, deployment failures, repeated debugging, unnecessary abstractions, dependency churn, agent/tool loops, or duplicated work.

Canonical loop:

`Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify`

Choose the smallest improvement likely to remove the observed bottleneck. Retrospective output should improve the delivery system, not become a status report, documentation exercise, or brainstorming ceremony.

## Frontend Product Direction

- Build the usable workflow screen first, not a marketing shell.
- Keep operational screens dense, clear, and workflow-oriented.
- Prefer existing UI primitives and lucide-react icons.
- Avoid generic decorative gradients, oversized cards, filler copy, and AI-slop styling.
- For SOP authoring, prefer a preview-centered workbench and contextual editing over a tall wizard.
- Ensure mobile and desktop layouts preserve critical information and interaction stability.

## Security And Data Integrity

- Never expose or commit real secret values from root `.env`, `server/.env`, or other environment state.
- Preserve credential boundaries for JWT, TTE encryption, and database credentials.
- When touching TTE/PDF behavior, verify the relevant hashing, encryption, ciphertext/versioning, signing output, authority resolution, and verification path.
- When touching contextual access, verify denial across unrelated Process Teams and inappropriate Faculty/Department scopes, not only successful paths.
- During legacy migration, verify old `opdId`-based assumptions do not accidentally grant cross-process or wrong-scope access.
- Keep database invariants aligned with `server/prisma/DB-INVARIANTS.md` when persistence invariants change.

## Final Reporting

For meaningful changes, report only decision-useful evidence:

- What behavior or repository rule changed.
- Files changed.
- Verification run and exact result.
- Skipped gates, unresolved risks, or assumptions.
- Current lifecycle/iteration position when tracked.
- The single next meaningful action, if one remains.
- Whether the state is local, committed, release-ready, released, or deployed only when supported by evidence.

Avoid narrating routine implementation steps or producing a long status report when a concise evidence summary is sufficient.
