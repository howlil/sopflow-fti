# SOPFlow Git Strategy

## Goal

Keep delivery fast, reviewable, reversible, and proportional to the requirement without adding branching or PR ceremony that does not reduce risk.

Git is a delivery mechanism, not a second product lifecycle. Engineering lifecycle and authority rules remain in `AGENTS.md`; verification commands remain in `DEVELOPMENT.md`.

## Integration Branch

`master` is the integration branch for this repository.

Treat current `master` as the base truth before starting a meaningful change. Re-read the affected files/refs when another change may have landed since the previous inspection.

Do not rewrite unrelated history.

## Working Tree Safety

Before changing code in a local checkout:

- inspect current branch and working-tree state;
- preserve unrelated user/agent changes;
- do not discard, reset, clean, stash, or overwrite unrelated work merely to obtain a clean tree;
- do not use destructive `reset --hard`, forced checkout, broad clean, or equivalent operations without explicit user direction;
- if unrelated changes coexist, scope edits and verification around the requested change instead of silently absorbing them.

When using a repository connector that creates commits directly, still preserve the same logical boundary: one commit/change should not include unrelated files.

## Branching

For meaningful implementation work, prefer one short-lived branch per coherent iteration/change when the execution environment supports normal branch/PR flow.

Suggested names:

```text
feat/<short-goal>
fix/<short-goal>
refactor/<short-goal>
chore/<short-goal>
```

Rules:

- branch from current `master`;
- one branch should represent one coherent vertical slice or iteration;
- do not create branch-per-file or branch-per-layer;
- do not stack dependent branches unless parallel delivery genuinely requires it;
- avoid long-lived feature branches;
- trivial bounded documentation/agent/config maintenance does not require branch ceremony when the user is already operating directly on `master` or the connector performs a single explicit repository mutation.

Branching must reduce integration/review risk; do not use it as ceremony.

## Commits

Commits should represent coherent, reviewable progress.

Prefer a small number of meaningful commits over:

- commit-per-file;
- noisy checkpoint commits;
- one giant commit mixing unrelated behavior.

Prefer concise intent-oriented commit messages using the repository's existing conventional style where practical:

```text
feat: add process team ownership
fix: enforce department approver scope
refactor: replace centralized evaluator semantics
test: cover process team authorization
docs(agents): define FTI domain rules
chore: align development commands
```

Do not rewrite already-shared history solely to normalize commit-message style.

A commit is evidence of repository state, not evidence that the change is `RELEASE READY`.

## Commit Boundary

A coherent commit should normally keep together code that must change together for one observable behavior or invariant.

Examples:

```text
schema + repository + service + focused tests
```

may belong together when they are one vertical behavior change.

Do not split commits artificially by technical layer if each intermediate commit would be misleading or broken.

Conversely, keep unrelated cleanup, formatting, dependency upgrades, and speculative refactors out of a feature commit.

## Verification Before Commit

Run the narrowest meaningful verification for the change before representing a commit as completed implementation.

Use `DEVELOPMENT.md` for exact commands.

The expected pattern is:

```text
implement bounded change
-> focused verification
-> relevant broader gate when risk requires it
-> inspect diff
-> commit coherent result
```

Do not require every repository-wide gate for every tiny change. Do not skip migration/runtime/browser/security evidence when the changed boundary specifically requires it.

## Self-Review

Before finalizing a meaningful implementation commit or PR, inspect the diff with this risk order:

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

Review comments/findings should correspond to a realistic failure, regression, security problem, or maintenance risk. Do not block delivery on preferences already enforced mechanically or aesthetic nits with no meaningful consequence.

## Pull Requests

Use a PR when the work is being delivered through a branch/review flow or when review isolation materially helps the change.

A PR should contain the smallest coherent change that satisfies the requested scope.

PR description should contain only decision-useful information:

- requested outcome;
- important behavior/design delta;
- affected product/security/data/architecture boundaries;
- verification evidence;
- known release-relevant limitations or migration notes.

Do not add generic checklists that do not change a decision.

A PR is not required merely because a change exists. For solo-agent iterations, the branch/PR overhead must be justified by integration or review value.

## Merge Boundary

Merge authority follows `AGENTS.md`.

Do **not** infer permission to merge merely because:

- implementation is complete;
- tests are green;
- a PR exists;
- self-review is clean.

When the user explicitly requests merge, or the current execution request explicitly includes merge as part of delivery, prefer:

```text
focused change
-> relevant quality gates green
-> self-review clean
-> no unresolved stop condition
-> squash merge
-> master
```

Use squash merge for a coherent sprint/change PR unless the repository/user explicitly requires another strategy.

Do not merge when any unresolved material boundary remains, including:

- unapproved product-semantic change;
- material architecture/data-ownership/security change;
- destructive migration;
- breaking public contract;
- uncertain CI/test failure ownership;
- unresolved migration/data mapping ambiguity.

Do not weaken branch protection or required review controls as an incidental workaround.

## Rebase And History Rewrites

- rebase/retarget a private short-lived branch when needed to keep its diff bounded against current `master`;
- do not force-push shared work without explicit need and awareness of collaborators;
- do not rewrite unrelated history;
- never use history rewriting as a substitute for fixing the actual current-state change.

For stacked work, merge the parent first, retarget/rebase the child onto current `master`, confirm the remaining child diff is still coherent, then rerun the relevant gates.

## CI

CI status is evidence only when CI actually exists and ran for the relevant revision.

Do not claim `CI green` from local tests.

If no repository CI workflow/required checks exist for the current revision, report local verification as local verification. Do not introduce a CI platform/workflow as part of an unrelated feature merely because one is absent.

When CI exists:

- fix failures caused by the requested change;
- distinguish pre-existing/unrelated failures from scoped regressions using evidence;
- do not broaden the implementation merely to clean unrelated CI debt unless explicitly requested.

## Release And Deployment

Commit, push, PR, merge, release, and production deployment are separate states.

Canonical distinction:

```text
implemented
!= committed
!= pushed
!= PR ready
!= merged
!= release ready
!= released
!= deployed
```

Never report a later state without evidence that action occurred.

Production release/deployment is never inferred from a successful merge.

## Agent Git Behavior

A user request to implement/fix/refactor/align authorizes the commits required by the repository connector/tool to persist that requested change, consistent with `AGENTS.md`.

It does not automatically authorize:

- destructive reset;
- force push;
- unrelated history rewrite;
- merge;
- release;
- deployment.

Keep Git operations proportional to the task. The desired result is a small, understandable history that mirrors meaningful delivery—not a large trail of agent ceremony.
