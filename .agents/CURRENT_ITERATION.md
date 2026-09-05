# Current Repository State

This file is the canonical resumable state for ongoing work. Product truth and the committed end state are owned by `PROJECT.md`.

## Target Shape

**Canonical target:** Full FTI.

Normal first-party SOP behavior must derive from native FTI semantics:

```text
Platform Role
+ Process Relationship
+ Organizational Authority
+ Process-owned SOP
```

OPD identity, OPD ownership, and legacy global workflow roles may remain only at explicit historical/external compatibility boundaries once Full FTI exit criteria are satisfied.

## Current Position

**Repository HEAD audited:** `9d42db993cf1cdf590e1dd52b1411fe28081c54f`

**Delivery state of the latest completed capability:** `INTEGRATED / RELEASE_READY`.

The latest integrated outcome retired unused legacy evaluation-value/history and WhatsApp/legacy notification-reminder runtime while preserving historical rows through the reversible archive migration `20260906120000_retire_legacy_evaluation_and_whatsapp`.

Native Process workflow is already the active path for:

- Process-bound SOP authoring;
- Process Owner review and revision feedback;
- contextual final approval;
- Process-native TTE and publication/effective transition;
- version replacement;
- contextual revocation;
- Process notifications and reminders;
- Process-first public discovery and verification.

Production release/deployment is **not claimed** by this state document without separate environment evidence.

## Material Delta to `PROJECT.md`

The repository must **not** yet claim `FULL_FTI / LEGACY_RETIRED`.

Repository-wide evidence still shows first-party compatibility dependencies that are explicit Full FTI retirement targets, including:

- client auth/user DTO and store shapes still carrying `opdId` and legacy `PeranPengguna`;
- client SOP/Pelaksana/query surfaces that still accept or derive OPD context;
- server `RolesGuard` / legacy role decorators still available for active legacy surfaces;
- active OPD controller/service/repository code;
- compatibility persistence such as `SOP.opdId`, `Pengguna.opdId`, and `ProcessSopBinding` while their retention contracts remain unresolved;
- legacy/unbound route/API/public compatibility that may still be required by existing consumers.

These are migration gaps against the committed Full FTI end state. Their existence is **not** authorization to remove them indiscriminately: `PROJECT.md` requires semantic cutover and proof of zero target dependency before contract cleanup.

## Current Product-Bet State

**No next product bet is implicitly authorized merely because the previous M14 work is integrated.**

Before implementation resumes, select the highest-value remaining bottleneck against the core FTI journey and `PROJECT.md` exit criteria. Candidate gap areas above are evidence for that decision, not an automatic roadmap.

When a product bet is authorized, record only:

```text
Outcome
Current bottleneck
Authorized delta
Evidence
Next meaningful action
```

Do not turn this file into a milestone archive, sprint ledger, or percentage-progress report.