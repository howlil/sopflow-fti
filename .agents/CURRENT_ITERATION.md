# CURRENT ITERATION

## State

The repository is completing the final FTI-only cleanup after persistence contraction.

Current target runtime:
- identity: `Pengguna` + `PlatformRole`;
- organization: `Department` and `Process`;
- workflow relationship: Process Owner / Process Member;
- legal signing authority: `DEAN` or `HEAD_OF_DEPARTMENT`;
- SOP lifecycle: `DRAFT -> PROCESS_REVIEW -> REVISION_REQUIRED | FINAL_APPROVAL -> TTE_PENDING -> EFFECTIVE -> SUPERSEDED | REVOKED`;
- active SOP ownership: `SOP.processId`;
- public archive: Process-first;
- notification, review, approval, TTE, versioning, and revocation are Process-native.

## Current milestone

Restore a coherent green master after schema contraction by removing stale compatibility callers from runtime, client contracts, tests, tooling, CI, and repository knowledge.

## Done when

One exact PR head passes Client CI, Server CI, FTI Domain CI, Migration Smoke, Full FTI Exit, and Container Build. Active source must contain no removed organization/global-role model. Historical migration SQL is immutable and excluded from this rule.
