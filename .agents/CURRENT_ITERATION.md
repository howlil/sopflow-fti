# Current Iteration

## Shape

**Milestone:** M12 — FTI Production Go-Live & Operational Closure
**State:** ACTIVE / PRODUCTION ACCESS REQUIRED
**Scope:** production preflight, migration/data-integrity proof, runtime cutover, deterministic native FTI qualification, failure/recovery proof, and release closure. No legacy OPD deletion or infrastructure-platform rewrite.

## Position

```text
M11 native FTI runtime                  INTEGRATED / MASTER
M11 integrated revision                 05b1adbc44db394b0bdff9dc7afd9ed10e71c145
S1 Production configuration/preflight  PARTIAL / SOURCE + COMPOSE CONFIG
S2 Production migration/integrity      NOT VERIFIED ON PRODUCTION DATABASE
S3 Production runtime cutover          NOT VERIFIED
S4 Native FTI workflow qualification   NOT RUN
S5 Failure/recovery qualification       NOT RUN
S6 Release closure                      NOT REACHED
```

## Delta

- M11 is integrated on local `master` and `origin/master`; post-merge Server CI, Client CI, FTI Domain CI, and Migration Smoke are green for the integrated revision.
- The existing Compose contract is five external values from `.env.example`; backend startup applies `prisma migrate deploy` before starting the application, and readiness checks database plus persistent PDF storage.
- Local `docker compose --env-file .env.example -f compose.yml config` passes, but Docker Desktop is unavailable on this host, so local image build/runtime evidence cannot be collected here.
- The checkout `.env` is not a valid canonical production input: it contains legacy `DB_PASSWORD`/Wago entries and must not be used for M12 deployment. Real production secrets remain in the deployment secret store and have not been read or transmitted.
- Read-only live probing of `https://sopflow.howlil.my.id` returned HTTP 200 with an empty body for `/`, `/api/health/live`, and `/api/health/ready`. This is not valid application health evidence and does not identify the running release.
- No verified MyPaaS application/project target, deployment API credential, SSH credential, production backup/recovery point, or runtime revision identity is available in this environment. No production mutation has been attempted.

## Evidence

- M11 integrated required checks — PASS on GitHub for `05b1adbc44db394b0bdff9dc7afd9ed10e71c145`.
- Compose Config — PASS on the existing runtime-contract revision `686cd5248fab0abcb5a02d8cfa98a71c167ea0bc`; M11 did not modify Compose/Dockerfile inputs.
- Container Build — PASS on the existing runtime-contract revision `686cd5248fab0abcb5a02d8cfa98a71c167ea0bc`; M11 did not modify Compose/Dockerfile inputs.
- Current local Compose config — PASS with `.env.example`.
- Live origin read-only probe — INSUFFICIENT: HTTP 200 but zero-byte bodies for root and both health paths.
- Production migration, runtime identity, persistence, TTE/public workflow, restart, rollback, and recovery evidence — NOT AVAILABLE.

## Next Move

Obtain or explicitly configure the verified MyPaaS deployment target and recovery point for `sopflow.howlil.my.id`, then execute in order: production preflight -> backup verification -> `prisma migrate deploy` -> integrity assertions -> image/runtime deploy -> readiness/API/persistence qualification -> focused native FTI lifecycle -> restart/recovery qualification -> exact revision closure. Keep the source SHA, image identity, migration revision, runtime identity, and evidence separate. Do not seed/reset production or bypass host-key/secret verification.
