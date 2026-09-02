# Current Iteration

## Shape

**Milestone:** M7 — FTI Account Provisioning & Bootstrap Completion  
**State:** IMPLEMENTED / VERIFICATION_PENDING  
**Integration branch:** `master`  
**Working branch:** `m7-account-provisioning`  
**Integration PR:** #14

Outcome: from one existing bootstrap `SUPER_ADMIN`, make FTI operational without manual database inserts or seeded workflow identities: create ordinary accounts through a target platform-admin surface, assign them to Process and organizational authority, then run the configured workflow with those accounts.

M7 closes a core bootstrap gap. It must not expose legacy workflow-role selection as target product semantics, introduce generic RBAC, user groups, invitation/SSO/bulk-import features, destructive account-history behavior, or protected Edit SOP workspace changes.

## Previous Milestone

M6 — FTI Administration Bootstrap & Configuration Integrity is **INTEGRATED** on `master`.

```text
PR #13 merge: cca92f6ca3b86dc4308fe54122f55e4f3c1b329b
Source verification head: 92315fa0123e1f7c7e6433d62446d5c2911c0a5d
Client CI: 33669858376 PASS
FTI Critical E2E: 33669858575 PASS (J08-J23)
Schema / migrations: unchanged
Protected Edit SOP implementation unchanged
Release/deploy: not performed
```

There is no remaining `Integrate M6` action.

## Position

```text
J24 Target Account Provisioning              IMPLEMENTED
J25 Account → Process Assignment             IMPLEMENTED
J26 Account → Organizational Authority       IMPLEMENTED
J27 Zero-to-Workflow Bootstrap               IMPLEMENTED
M7 exact-head verification                   PENDING
M7 integration                               PENDING
```

The M7 implementation is intentionally kept as one bounded capability milestone and one coherent integration PR. Do not split J24-J27 into separate planning cycles or tiny integration PRs.

## Verification Evidence

Previous implementation head `2d592d45f2cccbf2ec59bcfe6f523b2361565a96` established:

```text
Server CI: 33671264505 PASS
FTI Critical E2E: 33671264455 PASS (J08-J27)
Client build/route generation: PASS
Client generated route-tree consistency: FAIL
Client typecheck/unit: not reached because the route-tree consistency gate stopped the job
```

The Client failure is a deterministic generated-artifact mismatch caused by the new `/admin/accounts` route, not observed product-behavior failure. The generated route tree captured by CI is the source for the fix.

Because repository guidance and E2E selection are also being corrected on this branch, exact-head verification must run again after those commits. Do not broaden the test ladder merely because this consistency gate failed.

## Verification Selection For M7

M7 browser verification is risk-selected:

```text
Changed capability journeys: J24-J27
Direct administration/bootstrap regressions: J20-J23
Default M7 regression set: J20-J27
```

Earlier historical journeys are not cumulative default gates. Run them only when a specific affected boundary justifies them, or intentionally run the full set for a milestone/release/shared-harness qualification.

Migration Smoke is not required because M7 does not change migration-relevant inputs.

## Boundaries Preserved

- target platform account create/list surface only;
- ordinary `platformRole = USER` provisioning;
- compatibility backing fields remain internal transition seams;
- no generic RBAC/permission editor/user groups;
- no invitation email, CSV/bulk import, or SSO;
- no account deletion/history redesign;
- no new password-reset lifecycle;
- no revocation/cabutan product authority;
- no schema/migration change;
- no protected Edit SOP workspace implementation change;
- no release/deployment.

## Delta

Remaining work before integration:

1. commit the exact generated `client/src/routeTree.gen.ts` from the failed Client CI artifact;
2. make local/CI critical E2E selection explicit and risk-selected instead of cumulative-by-ID;
3. rerun exact-head required CI;
4. fix only observed failures inside the approved M7 boundary;
5. merge PR #14 when required evidence is green;
6. immediately make `master` state say M7 is integrated rather than leaving a stale pre-merge instruction.

## Next Move

Apply the route-tree and risk-selected E2E consistency changes, then use the new PR head as the single verification target. No new planning cycle is required.