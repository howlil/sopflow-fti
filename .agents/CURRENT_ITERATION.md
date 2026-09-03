# Current Iteration

## Shape

**Milestone:** M9 — Workflow Feedback Loop & Notification Closure  
**State:** INTEGRATED / RELEASE_READY  
**Source branch:** `m9-workflow-feedback`  
**PR:** #16  
**Squash merge:** `d2e736559497995db988385fd5cfdf52cfc3bb32`

Outcome: target-native Process users receive actionable feedback when Process Owner review requests revision, when contextual TTE makes an SOP effective, and when contextual authority revokes an effective SOP, without polling workflow state manually.

## Position

```text
J31 Revision Feedback                 VERIFIED / INTEGRATED
J32 Effective SOP Outcome             VERIFIED / INTEGRATED
J33 Revocation Feedback               VERIFIED / INTEGRATED
J34 Action & Inbox Integrity          VERIFIED / INTEGRATED
M9 milestone gate                     PASS
Release readiness                     RELEASE_READY
Release/deployment                    NOT PERFORMED
```

## Exact Source-Head Evidence

Source head: `5f4eaa701b887140b917f736c642908cc7984183`

```text
Server CI #253                       PASS
Client CI #339                       PASS
Migration Smoke #69                  PASS
FTI Critical E2E #109 — J31-J34      PASS
```

## Integrated Master Evidence

Integrated master revision: `d2e736559497995db988385fd5cfdf52cfc3bb32`

```text
Server CI #254                       PASS
Client CI #340                       PASS
Migration Smoke #70                  PASS
```

The browser gate is exact source-head evidence for the squash-integrated application content; the merge revision additionally passed the normal master Server/Client/Migration checks.

## Integrated Behavior

- J31 persists `PROCESS_REVISION_REQUESTED` for the persisted original Process-bound author in the same transaction as the revision transition and audit log.
- J32 persists `PROCESS_SOP_EFFECTIVE` for original author + Process Owner inside effective-state/TTE finalization, with recipient de-duplication and filesystem cleanup on rollback.
- J33 performs Process revocation status transition, audit, official-artifact revoke, and `PROCESS_SOP_REVOKED` persistence atomically for author + Process Owner.
- J34 reuses the existing notification bell and `/work/queue` target; Process read-state uses an unambiguous `/notifications/process/items/:processNotificationId/read` endpoint so the legacy dynamic route cannot intercept the request.
- legacy notification persistence remains separate.

## Boundaries Preserved

- no email/WhatsApp feedback channel;
- no generic event bus, notification preferences, or reminder scheduler expansion;
- no legacy/Process persistence unification;
- no Edit SOP protected-surface change;
- no OPD/legacy cleanup;
- no approval/TTE/revocation authority expansion;
- no release/deployment.

## Next Move

M9 is closed. The next approved milestone is **M10 — FTI-Native Public SOP Discovery & Archive Cutover**, executed as J35-J38. Release/deployment remains unauthorized.
