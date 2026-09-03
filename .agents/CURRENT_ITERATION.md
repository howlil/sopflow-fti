# Current Iteration

## Shape

**Milestone:** M9 — Workflow Feedback Loop & Notification Closure  
**State:** IMPLEMENTED / VERIFICATION_PENDING  
**Integration branch:** `m9-workflow-feedback`

Outcome target: target-native Process users receive actionable feedback when Process Owner review requests revision, when contextual TTE makes an SOP effective, and when contextual authority revokes an effective SOP, without polling workflow state manually.

M9 is one bounded workflow-feedback capability delivered continuously through J31-J34.

## Position

```text
J31 Revision Feedback                 IMPLEMENTED
J32 Effective SOP Outcome             IMPLEMENTED
J33 Revocation Feedback               IMPLEMENTED
J34 Action & Inbox Integrity          IMPLEMENTED
M9 milestone gate                     VERIFICATION_PENDING
Release readiness                     NOT YET CLAIMED
Release/deployment                    NOT PERFORMED
```

## Implemented Behavior

### J31 — Revision Feedback

- Process Owner `REVISION` keeps the existing workflow transition to `REVISI_DARI_EVALUATOR`;
- the original Process-bound author is resolved from persisted `DetailSOP.dibuatOlehId`, not legacy global role identity;
- `PROCESS_REVISION_REQUESTED` is persisted inside the same transaction as the status transition and audit log;
- realtime notification refresh is emitted only after the transaction commits.

### J32 — Effective SOP Outcome

- `PROCESS_SOP_EFFECTIVE` is created only after the contextual TTE finalization path is promoting the SOP to `BERLAKU`;
- original author and Process Owner are recipients;
- duplicate recipients are collapsed when one account is both author and Process Owner;
- notification rows are written inside the same database transaction as effective-state/TTE artifact finalization;
- if notification persistence fails, finalization rolls back and the already-written filesystem PDF is removed through the existing cleanup path.

### J33 — Revocation Feedback

- Process-bound revocation preserves the contextual Dean/Head-of-Department authority boundary from M8;
- the target revocation transaction performs the `BERLAKU -> DICABUT` compare-and-set, audit log, official-artifact `REVOKED` update, and `PROCESS_SOP_REVOKED` notification persistence atomically;
- original author and Process Owner are recipients with duplicate-recipient collapse;
- realtime refresh is emitted only after a successful commit.

### J34 — Action & Inbox Integrity

- existing `ProcessNotification`, notification bell, unread/read behavior, and target-native persistence are reused;
- new feedback events map to `/work/queue` rather than introducing new navigation or inbox surfaces;
- opening a Process feedback notification marks it read through the existing notification contract;
- legacy notification persistence remains separate.

## Persistence Change

M9 adds only three values to the existing `ProcessNotificationKind` enum:

```text
PROCESS_REVISION_REQUESTED
PROCESS_SOP_EFFECTIVE
PROCESS_SOP_REVOKED
```

An additive MariaDB migration extends the existing `ProcessNotification.kind` ENUM. No legacy notification table or history is modified.

## Verification Selection

Default M9 browser evidence is risk-selected to the changed capability:

```text
J31 Revision Feedback
J32 Effective SOP Outcome
J33 Revocation Feedback
J34 Action & Inbox Integrity
```

Expected milestone gate:

```text
Server CI
- Prisma validate/generate
- typecheck
- core unit tests
- focused Process notification/review/revocation/TTE tests

Client CI
- production build / route generation
- route-tree consistency
- typecheck
- unit tests

FTI Critical E2E
- journey registry audit
- J31-J34

Migration Smoke
- REQUIRED because ProcessNotificationKind persistence changed
```

Older journeys are added only if a failure indicates broader coupling. Full historical J01-J34 is not the default M9 gate.

## Boundaries Preserved

- no email/WhatsApp feedback channel;
- no generic event bus or notification platform abstraction;
- no notification preferences or reminder scheduler expansion;
- no legacy/Process persistence unification;
- no Edit SOP protected-surface change;
- no OPD/legacy role cleanup;
- no approval, TTE, or revocation authority change;
- no notification-bell redesign;
- no per-edit/noisy notification expansion;
- no release/deployment.

## Delta

J31-J34 implementation is present on the milestone branch. Exact-head CI, Migration Smoke, browser evidence, integration, and integrated-master evidence are still pending.

## Next Move

Run the proportional M9 gate on the exact branch head, fix only failures that invalidate the bounded capability, integrate one coherent M9 PR after all required evidence is green, verify the integrated master revision, then update this file to `INTEGRATED / RELEASE_READY` and **STOP**. Do not invent M10 or promote deferred legacy cleanup into scope.
