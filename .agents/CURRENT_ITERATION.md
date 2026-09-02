# Current Iteration

## Shape

**Milestone:** M7 — FTI Account Provisioning & Bootstrap Completion  
**State:** ACTIVE  
**Integration branch:** `master`

Outcome: from one existing bootstrap `SUPER_ADMIN`, make FTI operational without manual database inserts or seeded workflow identities: create ordinary accounts through a target platform-admin surface, assign them to Process and organizational authority, then run the configured workflow with those accounts.

M7 closes a core bootstrap gap. It must not expose legacy workflow-role selection as target product semantics, introduce generic RBAC, user groups, invitation/SSO/bulk-import features, destructive account-history behavior, or protected Edit SOP workspace changes.

## Previous Milestone Closure

M6 — FTI Administration Bootstrap & Configuration Integrity is complete and integrated.

```text
PR #13 merge: cca92f6ca3b86dc4308fe54122f55e4f3c1b329b
Source verification head: 92315fa0123e1f7c7e6433d62446d5c2911c0a5d
Client CI: 33669858376 PASS
FTI Critical E2E: 33669858575 PASS (J08-J23)
Schema / migrations: unchanged
Protected Edit SOP implementation unchanged
Release/deploy: not performed
```

## Position

```text
Target Account Provisioning                  ACTIVE
Account → Process Assignment                 PLANNED
Account → Organizational Authority           PLANNED
Zero-to-Workflow Bootstrap                   PLANNED
Milestone Gate                               PENDING
```

Current branch:

```text
m7-account-provisioning
```

## Slice Plan

### J24 — Target Account Provisioning

`SUPER_ADMIN` creates an ordinary active FTI account through a target administration surface. Creation uses the existing server-managed initial password and compatibility persistence defaults internally; the target UI must not ask the administrator to choose a legacy workflow role or OPD. The new account can authenticate, but creation alone grants no Process relationship, organizational authority, final approval, or TTE capability. Duplicate email/NIP is rejected and ordinary users are denied account administration.

### J25 — Account to Process Assignment

A newly provisioned account immediately appears as an assignable Process Owner/Member candidate. Assign new accounts to a fresh Process, then prove `/process-context/mine` and target Work capability are available only for those assigned identities.

### J26 — Account to Organizational Authority

A newly provisioned account can be assigned as Dean/Head of Department through the existing target authority administration surface. The authority becomes effective immediately and remains organization-scope correct. Account creation or `SUPER_ADMIN` status alone must not grant approval/TTE authority.

### J27 — Zero-to-Workflow Bootstrap

Starting from the bootstrap `SUPER_ADMIN` plus no pre-existing workflow identity dependency for the journey: provision fresh Member, Process Owner, and Head-of-Department accounts; create a Department and Department Process; assign the team and Kadep; authenticate as the fresh identities; create/submit a Process SOP; Process Owner accepts; Kadep performs final approval. Continue through existing TTE and public/effective evidence only if the current self-service TTE setup can be reused without changing product/security policy.

## Boundaries

In scope:

- target platform account create/list surface;
- ordinary `platformRole = USER` provisioning;
- compatibility backing fields hidden behind the target boundary;
- existing server-managed initial-password behavior;
- immediate Process/authority assignability;
- login/authentication of dynamically provisioned identities;
- zero-to-workflow bootstrap proof;
- FTI critical registry through J27.

Out of scope:

- legacy role-management UI redesign/removal;
- account deletion/history redesign;
- invitation email, CSV/bulk import, SSO;
- generic RBAC/permission editor or user groups;
- admin analytics/search polish beyond what creation requires;
- new password-reset lifecycle;
- revocation/cabutan product authority;
- release/deployment;
- protected Edit SOP workspace implementation changes.

## Verification

```text
Client CI
Server CI
Migration Smoke only if migration-relevant inputs change
FTI Critical E2E J08-J27
SUPER_ADMIN-only account administration
new account authenticates with canonical initial password
new account has no contextual workflow capability until assignment
new account is immediately assignable to Process/authority
zero-to-workflow journey uses dynamically provisioned identities
protected Edit SOP implementation unchanged
```

## Next Move

Implement J24 in `core/pengguna` behind `PlatformAdminGuard`, reuse existing profile validation/password/compatibility persistence rules, and expose a compact `/admin/accounts` target UI. Continue J25-J27 without another planning cycle.
