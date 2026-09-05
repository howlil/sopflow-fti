# Current Iteration

## Shape

**Milestone:** M14 - Full FTI Legacy Retirement
**State:** S4 VERIFIED / DELIVERY_PENDING
**Scope:** retire unused legacy evaluation-value/history and WhatsApp notification/reminder features using a staged, reversible database migration. Process-native review, approval, TTE, publication, revocation, notification, and reminder remain active.

## Position

```text
M11 native FTI runtime       INTEGRATED
M12 production evidence      SEPARATE / NOT CLAIMED HERE
M14 S4 legacy feature retire VERIFIED
M14 database contract        MIGRATION + DISPOSABLE SMOKE PASS
M14 verification              TYPECHECK + TEST + BUILD PASS
```

## Delta

- Removed active server evaluation controllers/services/repositories and legacy reminder runtime from application wiring.
- Removed active client evaluation API/query/cache/UI consumers, evaluator feedback/value panels, legacy evaluation submission action, and legacy notification composition.
- Removed stale legacy evaluation/BA E2E journeys and unused BA archive print surfaces; Process-native journeys remain the browser contract.
- Removed legacy BA evaluation TTE endpoints and compatibility signer repository/service; native Process TTE remains available.
- Kept `PengajuanEvaluasi` and legacy TTE parent columns as historical compatibility parents; they are not active sources for new workflow actions.
- Added migration `20260906120000_retire_legacy_evaluation_and_whatsapp` that renames `NilaiEvaluasi`, `LogNilaiEvaluasi`, `PengingatWhatsApp`, and `NotifikasiInApp` to `_retired_*` archive tables. The migration preserves rows and is recoverable by reverse rename if a separately approved retention operation requires it.
- Replaced the legacy notification stream with the same SSE behavior on `ProcessNotificationController`, backed by `ProcessNotification` and `NotificationEventsService`.
- Updated database invariants, architecture, and audit classification so archived legacy tables are observable but not active source-of-truth tables.

## Next Move

1. Review the complete working-tree diff and create the requested commit/PR through the repository delivery workflow when authorized.
2. Keep the persistent `sop-test-db` fixture unchanged unless explicitly requested; do not claim production or external-consumer retirement from local evidence.
