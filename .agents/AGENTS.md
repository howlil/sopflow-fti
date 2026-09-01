# SOPFlow Agent Operating Contract

This file is the repository-local operating contract for software-engineering agents working on SOPFlow. Keep it lean: durable project facts belong in `PROJECT.md`, commands and test details in `DEVELOPMENT.md`, and live iteration state in `CURRENT_ITERATION.md`.

## Instruction And State Sources

When instructions conflict, follow this order:

1. User request in the current conversation.
2. System, harness, and tool instructions loaded by the session.
3. Root `AGENTS.md` if one exists in the current checkout.
4. `.agents/AGENTS.md`.
5. `.agents/PROJECT.md` for durable repository facts and architecture boundaries.
6. `.agents/CURRENT_ITERATION.md` for active scope and iteration state.
7. `.agents/DEVELOPMENT.md` for commands, setup, and verification details.
8. Source files, tests, package scripts, and README as implementation evidence.

The actual checkout is the source of truth. Re-inspect relevant files before making claims about current behavior or state.

## Canonical Engineering Lifecycle

Use this lifecycle as the default orientation model:

`USER INTENT -> UNDERSTAND -> BOUND -> SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> QUALITY GATES -> RELEASE READY -> STOP`

Stages may be fused for small and unambiguous tasks. The lifecycle is an orientation model, not mandatory ceremony.

Do not skip a stage when doing so would hide a material product, architecture, security, data, or verification decision.

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
- Final approve, reject, change-direction, merge/release/deploy decisions when those actions are material to delivery.

### Agent owns

Within approved behavior and boundaries, act autonomously on:

- Repository inspection and targeted discovery.
- Implementation design.
- Coding and debugging.
- Test selection and execution.
- Verification and quality gates.
- Implementation-level decisions.
- Local refactoring required by the requested change.
- Maintaining accurate implementation evidence and iteration orientation.

Do not ask for approval for routine implementation choices that preserve the approved behavior, contracts, ownership, and architecture boundaries.

## Product Authority And Scope

- Do not introduce features, behavior, permissions, requirements, or product decisions the user did not request.
- Do not expand scope because of best practice, optimization, cleanup, future need, or speculative extensibility.
- If a missing requirement would materially change observable behavior, data, contracts, permissions, security, or architecture, surface it instead of guessing.
- If the requested behavior is clear, implement it without turning routine engineering choices into user decisions.

## Minimum Change Rule

Implement the smallest coherent vertical slice that satisfies the requested behavior.

Preference order:

1. Reuse an existing pattern.
2. Extend the existing owning component or module.
3. Add a small local abstraction.
4. Add a new component or module.
5. Change architecture only when necessary.

Guardrails:

- Modify only what the requirement needs.
- Preserve unrelated behavior and files.
- Do not rename, reorganize, clean, or refactor unrelated code.
- Do not add speculative abstractions, extension points, dependencies, or dependency upgrades.
- Keep change surface and migration cost proportional to the requirement.
- Prefer lower coupling, clear ownership, reversibility, and fewer new dependencies.

## Repository Boundaries

Use `.agents/PROJECT.md` as the durable repository map. Preserve these high-level ownership rules unless the user explicitly changes them:

Frontend:

- API transport belongs in `client/src/api`; shared API helpers belong in `client/src/lib/api`.
- Reusable UI primitives belong in `client/src/components/ui`.
- Workflow/page behavior belongs under `client/src/pages`; route wiring belongs under `client/src/routes`.
- Preserve TanStack Router conventions and avoid hand-editing generated route output unless the local workflow requires it.

Backend:

- Nest modules belong under `server/src/modules`.
- Preserve existing controller/service/repository ownership for business behavior and persistence.
- Shared cross-cutting behavior belongs under `server/src/common`.
- Prisma schema and migrations belong under `server/prisma`.
- Do not edit generated Prisma client output as the source change.

Domain ownership:

- SOP: `server/src/modules/sop` and corresponding client SOP surfaces.
- Evaluation: `server/src/modules/evaluation` and corresponding client evaluation surfaces.
- TTE: `server/src/modules/tte` and corresponding client TTE surfaces.
- Notifications: `server/src/modules/notifications`.

## Stop Conditions

Stop implementation and surface the decision when any of these becomes necessary:

- The request contradicts existing required behavior.
- A destructive migration or destructive state reset is required.
- A public contract must change.
- A security boundary must change.
- Data ownership must materially change.
- Service/module boundaries, communication patterns, or consistency model require a material architecture change.

Do not use stop conditions for normal implementation uncertainty that can be resolved by inspecting the repository.

## Repository Mutation And Release Boundary

A user request to implement, fix, refactor, or align repository content authorizes the file edits and tool-required commits necessary to perform that requested change.

Do not infer permission for destructive reset, merge, production deployment, or release unless the user requests it or the execution environment explicitly defines that action as part of the requested operation.

`RELEASE READY` means verification evidence is sufficient for the requested scope. It does not mean the product has been released or deployed.

## Feature Compass

Use `CURRENT_ITERATION.md` as a compact orientation layer for meaningful tracked work. It should make these facts obvious without reconstructing conversation history:

`Feature Shape -> Current Position -> Delta -> Evidence -> Next Move`

Rules:

- Keep it compact; do not duplicate the full specification.
- Update it when meaningful work changes the state of an existing tracked iteration.
- Do not create or rename a product iteration without user intent establishing that scope.
- The agent may move the recorded engineering position through IMPLEMENT, VERIFY, QUALITY GATES, and RELEASE READY when evidence supports it.
- Do not mark work RELEASED or DEPLOYED without actual evidence of that action.
- Do not force iteration tracking for trivial edits where it adds no orientation value.

## Verification And Quality Gates

Verification must target observable behavior and the risk boundary of the change.

Default progression:

1. Inspect or add the narrowest relevant test/evidence.
2. Implement the smallest useful slice.
3. Run focused verification.
4. Broaden to typecheck, lint, integration, browser, build, Compose, or other gates only when the affected boundary justifies it.

Test-first is useful when it clarifies behavior or prevents a regression, but do not force RED -> GREEN ceremony when a different verification path is more efficient and equally reliable.

Never claim browser, runtime, migration, deployment, PDF/TTE, or end-to-end confidence from unit tests alone. Use `.agents/DEVELOPMENT.md` for available commands and report skipped gates explicitly.

High-risk areas include authentication, role/OPD authorization, TTE credentials, PDF signing/verification, public archive access, notifications, persistence invariants, and Prisma migrations. Include negative-path verification when those boundaries change.

## Code Quality

Optimize for the smallest correct, clear, maintainable change.

- Follow existing repository conventions before introducing a new pattern.
- Keep behavior ownership explicit.
- Prefer self-explanatory names, types, and contracts.
- Document WHY, constraints, invariants, compatibility, concurrency, security, or non-obvious operational behavior; do not add comments that merely translate code.
- Remove dead code made obsolete by the requested change, but do not perform unrelated cleanup.
- Treat every new dependency as additional operated code; add one only when its value justifies its maintenance, security, and blast-radius cost.

## Retrospective Rule

Do not run a retrospective after every small change.

Use one after a sprint/release, significant rework or failure, repeated delivery friction, or an explicit user request. Base it on evidence:

`Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify`

Retrospective output should improve the delivery system, not become a status report or ceremony.

## Frontend Product Direction

- Build the usable workflow screen first, not a marketing shell.
- Keep operational screens dense, clear, and role-oriented.
- Prefer existing UI primitives and lucide-react icons.
- Avoid generic decorative gradients, oversized cards, and filler copy.
- For SOP authoring, prefer a preview-centered workbench and contextual editing over a tall wizard.
- Ensure mobile and desktop layouts preserve critical information and interaction stability.

## Security And Data Integrity

- Never expose or commit real secret values from root `.env`, `server/.env`, or other environment state.
- Preserve credential boundaries for JWT, TTE encryption, and database credentials.
- When touching TTE/PDF behavior, verify the relevant hashing, encryption, ciphertext/versioning, signing output, and verification path.
- When touching multi-role data access, verify cross-role and cross-OPD denial behavior.
- Keep database invariants aligned with `server/prisma/DB-INVARIANTS.md` when persistence invariants change.

## Final Reporting

For meaningful changes, report only decision-useful evidence:

- What behavior or repository rule changed.
- Files changed.
- Verification run and exact result.
- Skipped gates, unresolved risks, or assumptions.
- Current lifecycle/iteration position when tracked.
- The single next meaningful action, if one remains.
- Whether the state is local/committed/release-ready/deployed only when supported by evidence.
