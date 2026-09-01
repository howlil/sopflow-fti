# SOPFlow Decisions

This file records only durable material decisions whose rationale must remain visible to future agents. It is not a changelog, sprint log, or archive of every implementation choice.

When a decision is superseded, update or replace the effective decision here rather than appending contradictory history.

## D1 — FTI Workflow Is Process-Oriented

**Status:** ACTIVE

SOP ownership and review are contextual to a Process and its Process Team, not to the legacy OPD/global evaluator model.

Rationale:

- the FTI product domain is organized around operational/business processes;
- review accountability belongs to the Process Owner of the relevant process;
- global `EVALUATOR` / `PJ_EVALUATOR` semantics are legacy compatibility concepts, not target product roles.

Consequence:

- new target-domain authorization resolves Process relationship explicitly;
- legacy role concepts may remain only at compatibility boundaries.

## D2 — Final Approval Has Exactly Two Organizational Levels

**Status:** ACTIVE

Final approval resolves from Process organizational scope:

```text
FACULTY    -> DEAN
DEPARTMENT -> relevant HEAD_OF_DEPARTMENT
```

Units below faculty/department do not create another final-approval tier.

Rationale:

- approval authority is organizational, while Process ownership/review is operational;
- separating the two prevents Process Owner, unit leadership, and final authority from collapsing into one role model.

Consequence:

- do not introduce generic approval chains or `Unit Head -> approval` behavior without a new explicit product decision.

## D3 — SUPER_ADMIN Is Administration, Not Workflow Bypass

**Status:** ACTIVE

`SUPER_ADMIN` may administer platform configuration, accounts, Process metadata/assignments, and authority assignments, but it does not automatically grant author, Process Owner review, Dean/Kadep approval, or TTE signing authority.

Rationale:

- administrative power and business/legal workflow authority are separate security dimensions.

Consequence:

- permission checks must resolve the specific capability being exercised instead of using `SUPER_ADMIN` as a universal override.

## D4 — TTE Credential Availability Is Separate From Signing Authority

**Status:** ACTIVE

A user may need access to TTE credential setup because they hold a contextual Dean/Kadep assignment even when the legacy account role is unrelated.

Signing authority still comes from the resolved organizational authority for the SOP.

Rationale:

- credential readiness is an account capability;
- legal workflow authority is contextual to the organizational assignment.

## D5 — Legacy Migration Is Additive, Not Destructive By Default

**Status:** ACTIVE

The FTI cutover preserves required legacy/unbound behavior and historical evidence while target-domain paths become primary.

Rationale:

- current persistence and routes contain OPD-era contracts/data that cannot be safely reinterpreted mechanically;
- product semantics can cut over before destructive physical cleanup.

Consequence:

- do not drop legacy tables/columns/enums/routes or remap historical evidence merely for naming consistency;
- destructive cleanup requires a separately approved migration decision.

## D6 — Process Notifications Use Target-Native Persistence

**Status:** ACTIVE

Process workflow notifications are stored separately from legacy `PengajuanEvaluasi` / `JenisPengingatWhatsApp` notification history.

The UI may compose legacy and Process notifications into one bell/read model.

Rationale:

- the legacy persistence model encodes legacy evaluator concepts and is not a correct owner for Process-native events;
- shared presentation does not require shared historical storage.

Consequence:

- preserve persistence/history isolation unless a future explicit migration decision replaces this model.

## D7 — Global Pelaksana Catalog Is Not Process-Owned

**Status:** ACTIVE

`Pelaksana` is a reusable global procedure/swimlane actor catalog. Process scope determines who may author an SOP, not ownership of Pelaksana catalog rows.

SOP versions must preserve stable actor-label history for selected swimlanes.

Rationale:

- reusable actor identity and versioned SOP evidence have different ownership/lifecycle requirements.

Consequence:

- do not reintroduce OPD/Process ownership semantics for new Pelaksana behavior;
- renaming a catalog row must not rewrite already snapshotted historical SOP wording.

## D8 — Edit SOP Workspace Is A User-Protected Surface

**Status:** ACTIVE

The existing Edit SOP workspace must not be modified unless the current user instruction explicitly targets that workspace.

The exact semantic protection contract is owned by `PROTECTED_SURFACES.md` and is intentionally not duplicated here.

Rationale:

- the workspace behavior has been explicitly frozen as a durable repository boundary while surrounding workflow/navigation cutover continues.

## D9 — Target Workflow Surfaces Become Primary; Legacy Surfaces Remain Compatibility

**Status:** ACTIVE

For users with Process relationships, organizational authority, or platform administration capability, target contextual navigation/work queues are the primary product path. Legacy role-specific workflow routes may remain available for compatibility but should not define target FTI product semantics.

Rationale:

- users should not need to mentally translate legacy `PENYUSUN / EVALUATOR / PJ_* / KEPALA_OPD` concepts to operate Process-bound SOP work.

Consequence:

- legacy route compatibility is not permission to propagate legacy vocabulary into new target-facing surfaces.