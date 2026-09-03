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

## D10 — Process-Bound Revocation Uses The Contextual Final Authority

**Status:** ACTIVE

An effective Process-bound SOP may be revoked only by the organizational authority currently resolved for that Process:

```text
FACULTY    -> active DEAN
DEPARTMENT -> active HEAD_OF_DEPARTMENT for that department
```

`SUPER_ADMIN`, Process Owner, and Process Member do not gain revocation authority from those capabilities alone.

Revocation is a terminal lifecycle transition from `BERLAKU` to `DICABUT`, not deletion. Historical version, approval, TTE, audit, and signed-artifact evidence remain preserved, while the revoked version stops being current/effective/public.

Rationale:

- the authority accountable for making a Process SOP formally effective is the coherent authority boundary for ending that effective state;
- using the existing contextual authority resolver prevents a parallel legacy `KEPALA_OPD` authorization model from surviving on the target path;
- preserving evidence maintains audit/legal history without treating a revoked document as currently effective.

Consequence:

- target revocation must reuse organizational authority resolution rather than global account role checks;
- legacy/unbound SOP may continue using compatibility behavior until separately retired;
- do not add `SUPER_ADMIN` override, generic revocation chains, or destructive evidence cleanup without a new explicit product decision.

## D11 — Public FTI Discovery Is Process-First; Legacy Public APIs Remain Compatibility

**Status:** ACTIVE

The normal public archive experience for the FTI target product is organized by persisted organizational scope and `Process`, then by the current published SOPs whose native `SOP.processId` points to that Process. `ProcessSopBinding` is retained only as migration/backfill evidence and an explicit compatibility boundary.

Legacy OPD-based public endpoints remain compatibility contracts and legacy/unbound published SOPs may remain discoverable through an explicit compatibility fallback. A Process-bound SOP must not be duplicated in the target catalog merely because its legacy `SOP.opdId` compatibility shadow still exists.

Rationale:

- the target product model is Process-oriented, so public discovery should expose the same domain users see during authoring/review rather than require visitors to understand OPD-era ownership;
- publication eligibility is a lifecycle/artifact fact (`BERLAKU` + official published PDF), while public classification is the native `SOP.processId` ownership fact;
- preserving additive compatibility avoids destructive migration while allowing the target information architecture to become primary.

Consequence:

- new target archive endpoints live under `/sop/public/fti/...` rather than repurposing legacy endpoint semantics;
- normal `/arsip` navigation uses faculty/department Process context, with global search as a shortcut;
- revocation must remove a Process-bound SOP from current target discovery without deleting historical/TTE evidence;
- do not reintroduce OPD as the primary target public grouping merely because legacy columns/endpoints remain.

## D12 — Full FTI Requires Zero Active OPD Dependency

**Status:** ACTIVE

The committed target end state is **Full FTI**. OPD-era identity, ownership, and global workflow roles are transitional compatibility mechanisms only; they must not remain hidden sources of truth for active FTI product behavior.

Full FTI means:

```text
User
  -> Platform Role
  -> Process Relationship
  -> Organizational Authority

Process
  -> organizational scope
  -> SOP
       -> Process review
       -> contextual approval
       -> contextual TTE
       -> publication / revocation
```

Rationale:

- a permanent `FTI facade -> OPD core` would preserve two competing domain models and make authorization, ownership, routing, and future product changes ambiguous;
- FTI semantics are already the committed product model, so compatibility must converge toward retirement rather than become a parallel architecture;
- direct FTI ownership reduces hidden coupling while preserving historical/legal evidence through an explicit staged migration.

Migration strategy:

```text
EXPAND
  -> introduce native FTI ownership/contracts while legacy compatibility remains intact

BACKFILL
  -> populate native relationships from authoritative persisted evidence

CUTOVER
  -> move first-party reads/writes/authorization entirely to native FTI sources

PROVE
  -> verify data completeness, workflow integrity, evidence preservation, and zero first-party legacy dependency

CONTRACT
  -> retire obsolete legacy schema/contracts/adapters only after the cutover is proven
```

Consequences:

- native SOP ownership must ultimately be directly canonical to `Process`; `SOP.opdId` and `ProcessSopBinding` are transitional seams, not permanent target architecture;
- target authorization must ultimately operate without `Pengguna.opdId` or legacy `PeranPengguna` workflow semantics;
- `OPD`, `RiwayatOpdPengguna`, `OPDPeraturan`, OPD-scoped compatibility fields, legacy global workflow roles, and OPD-oriented first-party routes/APIs must not own target behavior;
- do not mechanically rename `opdId` to `departmentId`; Department context is only introduced where the FTI product actually requires it;
- surviving legacy structures after semantic cutover must be isolated to explicit historical/external compatibility boundaries with a concrete retention reason;
- compatibility must not become indefinite dual-write, dual-ownership, or dual-authority architecture;
- no implementation milestone is activated by this decision alone. Physical cleanup remains separately scoped work and must preserve migration history, audit/TTE/version/publication evidence, and external compatibility requirements.

Exit condition:

The repository may claim `FULL_FTI / LEGACY_RETIRED` only when active first-party FTI workflows, authorization, TTE, notification, publication, versioning, revocation, and public discovery run without OPD/global-role fallback, native data backfill is proven complete, and any remaining OPD references are limited to immutable history or explicitly documented compatibility adapters.
