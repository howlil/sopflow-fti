# SOPFlow Backend Skill

Use this skill for backend work in `server/`. Product semantics and material decisions remain owned by the canonical `.agents` files.

Read the affected parts of `PROJECT.md`, `ARCHITECTURE.md`, `CURRENT_ITERATION.md`, `CODE_PATTERNS.md`, `QUALITY.md`, and `DECISIONS.md` before changing behavior.

## Stack

```text
NestJS 11
TypeScript strict
Prisma 7
MariaDB
Jest
Swagger decorators
JWT cookie authentication
```

Do not add another ORM, application framework, validation framework, job system, event bus, or generic workflow engine unless the requirement needs a material architecture change.

## Ownership

Default request path:

```text
Controller
  -> Service
       -> Repository / explicit collaborator
            -> Prisma
```

Primary owners:

```text
server/src/modules                 domain/use-case code
server/src/common                  real cross-cutting infrastructure
server/prisma/schema.prisma        canonical persistence model
server/prisma/migrations           immutable migration history
server/prisma/DB-INVARIANTS.md     current database invariants
```

Put behavior in the narrowest existing owner that can coherently own it.

## Controllers

Controllers own transport only:

- route/method/status;
- body/query/param extraction and validation;
- auth guard/decorator wiring;
- authenticated user handoff;
- response-envelope and Swagger metadata.

Do not put ProsesBisnis authorization, workflow policy, authority resolution, transaction orchestration, or complex Prisma queries in controllers.

## Services

Services own use cases and policy:

```text
resolve target/context
-> assert contextual permission
-> read current state
-> validate preconditions
-> resolve authority/collaborators
-> perform atomic transition
-> return current representation
```

Use explicit Nest exceptions for observable failures:

```text
NotFoundException
ForbiddenException
ConflictException
BadRequestException
```

## FTI Authorization

SOP workflow authorization is contextual:

```text
author
  -> ProsesBisnis Owner OR Member for that ProsesBisnis

process review
  -> Owner for that ProsesBisnis

final approval / TTE
  -> contextual DEAN or HEAD_OF_DEPARTMENT for that ProsesBisnis scope

platform administration
  -> platformRole capability
```

Use the existing context/authority services:

```ts
await konteksProsesBisnisService.assertCanAuthor(user.sub, prosesBisnisId)
await konteksProsesBisnisService.assertCanReview(user.sub, prosesBisnisId)
```

`SUPER_ADMIN` is not a workflow bypass. Do not infer SOP workflow access from a global role.

## SOP Ownership

Every SOP belongs to exactly one ProsesBisnis. `SOP.processId` is required in the canonical schema.

Repository/service contracts that resolve an existing SOP must therefore expose a non-null ProsesBisnis ID. Missing records are represented by the resolver returning `null`; existing SOP ownership is not nullable.

Do not reintroduce unbound/imported-archive compatibility branches.

## Repository Pattern

Repositories own:

- Prisma reads/writes;
- persistence projections/selects/includes;
- persistence filtering/order;
- reusable atomic persistence helpers.

Services still own authorization, state policy, and the choice of transition/side effect.

Direct `PrismaService` use in a small service is acceptable when a repository would only add indirection. Follow the nearest module pattern.

## DTOs

Use DTOs for real transport contracts. Do not create one DTO per internal layer when there is no distinct contract.

Generated Prisma types belong at persistence/domain implementation boundaries; do not expose raw Prisma models as accidental public API contracts when a stable DTO is needed.

## Workflow Changes

For state-changing SOP operations:

1. resolve the SOP/detail and required ProsesBisnis ownership;
2. assert contextual authorization;
3. read current state;
4. validate state-specific preconditions;
5. resolve target state/recipient/authority;
6. use compare-and-set style updates when races matter;
7. write audit/history and durable side effects in the same transaction when they must not diverge;
8. emit non-durable realtime signals only after commit.

Typical concurrency guard:

```ts
const updated = await tx.detailSOP.updateMany({
  where: { detailSopId, status: expectedStatus },
  data: { status: targetStatus, terakhirDieditOlehId: userId },
})

if (updated.count !== 1) {
  throw new ConflictException('Status SOP berubah. Muat ulang lalu ulangi aksi.')
}
```

## Transactions

One transaction should represent one business atomicity boundary.

Good candidates:

- workflow state + audit + durable notification;
- final approval + approval evidence;
- TTE state + signing evidence;
- version replacement/effective-version transition;
- ProsesBisnis team/ownership mutations that must remain consistent.

Do not wrap unrelated network calls, expensive work, or unrelated reads in broad transactions.

## Notifications

ProsesBisnis notifications use the current `NotifikasiProsesBisnis` persistence.

```text
resolve recipient from ProsesBisnis/authority context
-> write durable notification in the transition transaction when required
-> emit in-app change signal after commit
```

Do not add new SOP workflow events to retired evaluation/reminder persistence.

## Final Authority

```text
FACULTY
  -> DEAN

DEPARTMENT
  -> HEAD_OF_DEPARTMENT for that department
```

Use the existing authority resolver/service. Do not add arbitrary per-SOP approvers or make `SUPER_ADMIN` an approver without an explicit product-contract change.

## TTE

Credential readiness and signing authority are different concerns.

Preserve:

- PIN/hash handling;
- encrypted personal P12 storage;
- contextual authority resolution;
- signed artifact/certificate evidence;
- effective/version transition semantics;
- public verification behavior.

Signing uses the user's personal certificate. Do not add a server-global P12 fallback.

Never log or expose PINs, passphrases, ciphertext, private key material, or raw credentials.

## Prisma / Migrations

- edit `server/prisma/schema.prisma` for canonical schema changes;
- regenerate Prisma client;
- inspect generated/raw migration SQL;
- update `server/prisma/DB-INVARIANTS.md` when an invariant changes;
- treat successfully applied shared migrations as immutable;
- fix later defects with a new forward migration;
- never fabricate, silently delete, or silently reinterpret persisted data.

`pnpm db:fresh` is destructive and requires explicit user authorization.

If migration recovery is required, follow `server/prisma/MIGRATION-RECOVERY.md`; do not substitute `migrate reset` for explicit failed-migration recovery.

## Testing

Prefer the smallest deterministic evidence for the changed risk:

```text
service/domain policy       -> focused Jest unit tests
persistence/transaction     -> relevant integration evidence
schema/migration/invariant  -> Migration Smoke / DB audit
```

For workflow changes, cover material happy and negative paths: wrong actor, wrong state, stale concurrent transition, authority/recipient, and absence of invalid side effects.

Do not preserve impossible historical states in unit fixtures after the canonical schema makes them structurally invalid.

## Implementation Workflow

```text
1. Read affected product/architecture constraints.
2. Inspect the nearest controller/service/repository/test pattern.
3. Identify behavior owner and authorization dimension.
4. Implement the smallest coherent change.
5. Reuse existing context/authority/persistence collaborators.
6. Add focused tests for changed risk.
7. Run typecheck + relevant tests; add migration/integration qualification only when the changed boundary requires it.
8. Report evidence for the exact revision.
```

## Do Not

- put core policy in controllers;
- infer workflow authorization from global roles;
- use `SUPER_ADMIN` as a workflow bypass;
- reintroduce nullable/unbound SOP ownership;
- duplicate final-authority rules;
- create repositories or abstractions that only add indirection;
- emit durable side effects outside a required atomic transition;
- introduce a generic workflow engine for the current fixed lifecycle;
- rewrite applied migration history casually;
- expose TTE secrets or internal stack details;
- add compatibility branches for retired OPD/global-workflow-role semantics;
- refactor unrelated modules while delivering a bounded change.
