# SOPFlow Git Strategy

## Goal

Keep delivery fast, reviewable, reversible, and continuously integrated without turning Git into a second planning lifecycle.

Canonical delivery hierarchy:

`Milestone -> Slice -> Logical Change -> Commit`

Canonical Git principle:

**Plan at milestone boundaries. Integrate at logical-change boundaries. Increase planning horizon, not integration batch size.**

`master` is the integration branch and should stay close to verified working state.

## Integration First

Do not accumulate completed slices on stacked feature branches when they can be safely integrated.

Default flow for an approved logical change:

```text
bounded logical change
-> focused verification
-> relevant quality gates
-> self-review
-> integrate to master
-> continue next logical change/slice
```

Integration does not imply release or deployment.

```text
implemented
!= integrated
!= release ready
!= released
!= deployed
```

## Branching

Branches are an isolation mechanism, not a unit of planning.

Use a short-lived branch when it materially improves safety, review isolation, CI execution, or recovery for a meaningful logical change. Do not create a branch merely because a new slice starts.

Preferred names when a branch is useful:

```text
feat/<short-goal>
fix/<short-goal>
refactor/<short-goal>
chore/<short-goal>
```

Rules:

- branch from current `master`;
- keep branch scope to one coherent logical change or tightly coupled set of changes;
- integrate promptly after relevant gates are green;
- do not create branch-per-file, branch-per-layer, or branch-per-sprint;
- do not stack dependent branches by default;
- if stacking is temporarily necessary, integrate the parent as soon as safe and retarget/rebase the child so the outstanding diff stays small;
- do not keep a verified branch alive merely to wait for milestone completion.

Trivial docs/agent/config maintenance may go directly to `master` when isolation provides no value.

## Commits

Commits are the smallest durable Git unit. They should represent coherent reviewable progress, not ceremony.

Prefer a small number of intent-oriented commits over commit-per-file or noisy checkpoints.

A coherent commit may include multiple technical layers when they must change together for one behavior/invariant, for example:

```text
schema + service + API + focused tests
```

Do not split by frontend/backend/database layer if intermediate commits would be misleading or broken.

Keep unrelated cleanup, formatting, dependency upgrades, and speculative refactors out of the logical change.

## Verification Before Integration

Use the narrowest meaningful verification for the changed risk boundary before integration.

Typical flow:

```text
implement
-> focused tests/evidence
-> affected broader gate when justified
-> inspect diff
-> integrate
```

Do not require every repository-wide gate for every small change. Do not skip migration/runtime/browser/security/TTE evidence when that boundary changed.

CI is evidence only when it actually ran for the relevant revision.

## Self-Review

Before integration, inspect the logical change using this risk order:

```text
correctness
-> authorization/security
-> data ownership/contracts
-> workflow/state invariants
-> concurrency/failure behavior
-> migration compatibility
-> performance/cost where relevant
-> maintainability
-> tests/docs
```

Block integration only for realistic regressions, unresolved stop conditions, or material risks—not aesthetic preferences or already-mechanically-enforced nits.

## Pull Requests

PRs are optional review/isolation surfaces, not mandatory delivery ceremonies.

Use a PR when:

- branch protection/review requires it;
- review isolation materially reduces risk;
- CI or collaboration benefits from it.

A PR should correspond to the smallest coherent logical change that is worth independent integration.

PR descriptions should contain only decision-useful information:

- outcome;
- important behavior/design delta;
- affected product/security/data/architecture boundaries;
- verification evidence;
- release-relevant limitations/migration notes.

Do not wait until the whole milestone is complete to open/merge a PR if earlier logical changes are already independently safe.

## Merge / Integration Authority

Within an already approved milestone, routine integration of a verified logical change is agent-owned engineering execution when it:

- preserves approved product behavior and architecture boundaries;
- has relevant gates green;
- has no unresolved stop condition;
- does not itself constitute release/deploy/destructive action.

Do not require a separate merge ceremony for every slice.

Still stop and request explicit user direction if integration would include:

- unapproved product semantics;
- material architecture/data-ownership/security changes;
- destructive migration;
- breaking public contract;
- unresolved migration/data ambiguity;
- uncertain CI failure ownership.

When a PR merge is appropriate, prefer squash for a noisy temporary branch representing one logical change; preserve meaningful commit history when commits themselves are coherent integration units. A clean fast-forward is preferred when the branch is a linear descendant and history is already meaningful.

## Working Tree And History Safety

- preserve unrelated user/agent changes;
- do not reset/clean/stash/overwrite unrelated work merely to get a clean tree;
- never use destructive `reset --hard`, force checkout, or broad clean without explicit direction;
- do not force-push shared work unless necessary and understood;
- do not rewrite unrelated history.

## Milestone Continuity

Completing a slice does not imply stopping Git delivery.

After a slice is integrated:

```text
update CURRENT_ITERATION.md
-> select next approved slice
-> continue
```

Re-plan/branch differently only if evidence materially changes the milestone boundary or implementation isolation needs.

## Release And Deployment

Integration to `master` is not production authority.

Release/deployment require explicit direction and evidence appropriate to the environment. Never report released/deployed state from CI or merge alone.

## Agent Git Behavior

A user-approved milestone or implementation request authorizes repository edits, coherent commits, and routine logical-change integration needed to execute that approved scope.

It does not automatically authorize:

- destructive reset;
- force push/history rewrite;
- release;
- production deployment.

Keep history small and understandable. The desired outcome is continuous small-batch integration, not a trail of sprint/branch ceremony.
