# Current Iteration

## Shape

**Milestone:** M5 — Process Version Lifecycle Cutover & Historical Integrity  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: make Process-bound SOP version creation use contextual Process authoring authority, then prove replacement/supersession preserves one effective version, signing evidence, official artifacts, version history, and public integrity for both Faculty and Department scopes.

M5 is a semantic cutover/reliability milestone. It must not introduce a generic version engine, new approval tier, arbitrary rollback, destructive legacy cleanup, target revocation authority, release/deploy, or protected Edit SOP workspace changes.

## Previous Milestone Closure

M4 — Department Workflow Parity & Isolation is complete and release-ready.

```text
PR #9 merge: c644b5a86a66153ef3934fabaebf69413a7fc735
Client CI: 33559540503 PASS
Server CI: 33559540442 PASS
Migration Smoke: 33559540449 PASS
FTI Critical E2E: 33559540423 PASS (J08-J15)
```

## Position

```text
Contextual Version Creation                  ACTIVE
Faculty Version Replacement                  PLANNED
Department Version Replacement               PLANNED
Historical/Public Integrity                  PLANNED
Milestone Gate                               PENDING
```

Current branch:

```text
m5-process-version-lifecycle
```

## Slice Plan

### J16 — Contextual Version Creation

For a Process-bound SOP, Process Owner/Member may create one new draft version from a terminal version. Unrelated Process actors, contextual authority without Process relationship, and SUPER_ADMIN without Process relationship are denied. Legacy/unbound SOP version creation remains compatibility behavior. Concurrent creation must still produce at most one active draft.

### J17 — Faculty Version Replacement

Take a Faculty Process SOP from V1 BERLAKU through V2 Process review, Dean approval, and contextual TTE. Signing V2 must atomically move V1 to DIGANTIKAN, its official PDF to SUPERSEDED, and V2 to BERLAKU/PUBLISHED with exactly one effective version.

### J18 — Department Version Replacement

Repeat the replacement lifecycle for a Department Process SOP with the relevant Head of Department, preserving cross-department and Dean isolation.

### J19 — Historical/Public Integrity

Prove source-version lineage, historical signing evidence preservation, current public archive correctness, and failure atomicity: failed replacement signing must not supersede the existing effective version or leave partial publication/signing state.

## Boundaries

In scope:

- Process-aware version creation authorization;
- Faculty and Department target replacement journeys;
- one-BERLAKU and artifact supersession invariants;
- historical lineage/evidence preservation;
- failed-signing atomicity evidence;
- FTI critical browser registry extended through J19.

Out of scope:

- target Process revocation/cabutan authority semantics;
- destructive removal of legacy roles/routes/tables;
- public archive IA redesign;
- arbitrary rollback/version branching;
- editing historical signed versions;
- release/deployment;
- protected Edit SOP workspace implementation changes.

## Stop Condition

If M5 requires deciding who may revoke/cabut a target Process SOP, stop that sub-scope. Current product authority does not define target revocation authority and the existing legacy `KEPALA_OPD` rule must not be silently reinterpreted.

## Verification

```text
Client CI
Server CI
Migration Smoke only when migration-relevant inputs change
FTI Critical E2E J08-J19
one effective BERLAKU version
previous official artifact SUPERSEDED on replacement
failed replacement leaves previous effective/public evidence intact
protected Edit SOP implementation unchanged
```

## Next Move

Implement J16 contextual version creation with the existing Process authorization pattern, preserving legacy/unbound compatibility, then continue J17-J19 without a new planning cycle.
