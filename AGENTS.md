# SOPFlow Agent Gateway

This file is the repository entry point for any software-engineering agent, coding assistant, IDE agent, CLI agent, or automation working in this repository.

It is intentionally thin. Do not duplicate the operating rules here. The canonical agent system lives under `.agents/`.

## Required Reading

Before making a meaningful repository change, read the relevant `.agents` sources in this order:

1. `.agents/AGENTS.md` — canonical engineering lifecycle, authority split, scope rules, stop conditions, verification, quality, and agent behavior.
2. `.agents/PROJECT.md` — durable SOPFlow FTI product/domain truth, approved invariants, architecture/domain boundaries, and legacy-to-target migration direction.
3. `.agents/CURRENT_ITERATION.md` — active Feature Compass: current feature shape, position, delta, evidence, and next move.
4. `.agents/CODE_PATTERNS.md` — repository-specific implementation conventions, backend/frontend patterns, naming, state ownership, transactions, and refactor thresholds.
5. `.agents/GIT_STRATEGY.md` — branch, commit, PR, merge, history-safety, CI, and release-state rules.
6. `.agents/DEVELOPMENT.md` — setup, commands, testing, migration, and runtime verification guidance.

Read only as much as needed for the task, but do not skip a source whose boundary is materially affected.

## Canonical Authority

When repository documentation conflicts, use this precedence:

```text
current user instruction
-> system / harness / tool instruction
-> this root AGENTS.md gateway
-> .agents/AGENTS.md
-> .agents/PROJECT.md
-> .agents/CURRENT_ITERATION.md
-> .agents/CODE_PATTERNS.md
-> .agents/GIT_STRATEGY.md
-> .agents/DEVELOPMENT.md
-> source code / tests / migrations / package scripts / README as implementation evidence
```

`PROJECT.md` is authoritative for the approved target FTI domain even when current source code still contains legacy OPD/government terminology.

The actual checkout remains authoritative for what is currently implemented.

## Agent-Agnostic Rule

These instructions apply regardless of agent/vendor/tool, including but not limited to Codex, Claude Code, GitHub Copilot/agents, Cursor-style agents, IDE assistants, MCP-driven agents, and future automation.

Do not create a parallel workflow merely because a particular agent platform has its own planning or memory mechanism.

Agent-specific configuration may adapt execution mechanics, but must not override the repository's approved product semantics, engineering lifecycle, authority boundaries, code patterns, or Git strategy unless the user explicitly instructs otherwise.

## Operating Principle

Use the canonical lifecycle from `.agents/AGENTS.md`:

`USER INTENT -> UNDERSTAND -> BOUND -> SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> QUALITY GATES -> RELEASE READY -> STOP`

Stages may be fused for small/unambiguous work. Do not turn this lifecycle into mandatory ceremony.

Default execution shape:

`Problem -> Required Behavior/Contract -> Smallest Vertical Slice -> Implementation -> Evidence -> Next Move`

## Scope And Autonomy

The user owns product meaning and material boundaries. The agent owns implementation execution inside those approved boundaries.

Do not:

- invent product requirements;
- expand scope for speculative best practice;
- preserve legacy OPD semantics when they conflict with `.agents/PROJECT.md`;
- perform unrelated refactors;
- introduce architecture/framework abstractions without demonstrated need;
- treat green tests as permission to merge, release, or deploy;
- discard unrelated working-tree changes;
- perform destructive migration/reset/history operations without explicit authorization.

Do autonomously:

- inspect relevant code;
- choose routine implementation details;
- implement the smallest coherent vertical slice;
- test/debug/verify;
- make local refactors required by the change;
- produce tool-required coherent commits when repository mutation was requested;
- update `.agents/CURRENT_ITERATION.md` when an already-established meaningful iteration changes state.

## Source Placement

Keep repository knowledge in the correct source:

```text
HOW agents operate
-> .agents/AGENTS.md

WHAT the product/domain is
-> .agents/PROJECT.md

WHERE the active iteration is
-> .agents/CURRENT_ITERATION.md

HOW recurring code should be shaped
-> .agents/CODE_PATTERNS.md

HOW Git delivery is handled
-> .agents/GIT_STRATEGY.md

HOW to run and verify the repository
-> .agents/DEVELOPMENT.md
```

Do not turn this root gateway into another comprehensive rulebook. When a durable rule changes, update the owning `.agents` file rather than copying the rule here.

## Final Requirement

Before claiming completion, report evidence proportional to the task and distinguish accurately between:

```text
implemented
committed
PR-ready
merged
release-ready
released
deployed
```

Never claim a later state without evidence that the corresponding action occurred.
