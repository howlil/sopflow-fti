# Current Iteration

## Shape

**Milestone:** M6 — FTI Administration Bootstrap & Configuration Integrity  
**State:** RELEASE_READY  
**Integration branch:** `master`

Outcome achieved: a platform `SUPER_ADMIN` can bootstrap FTI Department, Process Team, Dean, and Head of Department configuration through the target administration surfaces; that configuration becomes real contextual workflow capability without making the administrator a workflow bypass.

## Milestone Closure

```text
J20 Admin Entry & Isolation                  VERIFIED
J21 Process Configuration Bootstrap          VERIFIED
J22 Organizational Authority Configuration   VERIFIED
J23 Configuration → Workflow Bootstrap        VERIFIED

Source head before closure docs: 92315fa0123e1f7c7e6433d62446d5c2911c0a5d
Client CI: 33669858376 PASS
FTI Critical E2E: 33669858575 PASS (J08-J23)
Server production code: unchanged
Schema / migrations: unchanged
Protected Edit SOP implementation: unchanged
Release/deploy: not performed
```

M6 exposed only E2E shared-state coupling. J08/J12 were corrected to verify contextual capability and cross-Department isolation rather than exact seed aggregate counts. No product semantics were weakened.

## Position

```text
Admin Entry & Isolation                      VERIFIED / INTEGRATION READY
Process Configuration Bootstrap              VERIFIED / INTEGRATION READY
Organizational Authority Configuration       VERIFIED / INTEGRATION READY
Configuration → Workflow Propagation          VERIFIED / INTEGRATION READY
Milestone Gate                               PASS
```

## Boundaries Preserved

- no generic RBAC or new workflow role model;
- no authority history/revocation semantics;
- no in-flight reassignment behavior;
- no destructive legacy cleanup;
- no schema/migration change;
- no protected Edit SOP workspace change;
- no release/deploy.

## Next Move

Integrate M6, then start M7 — FTI Account Provisioning & Bootstrap Completion. M7 must close the remaining zero-to-operational bootstrap gap: a `SUPER_ADMIN` creates ordinary FTI accounts through a target platform-admin surface and those accounts can then be assigned to Process and organizational-authority context without manual database insertion or workflow identity seed dependencies.
