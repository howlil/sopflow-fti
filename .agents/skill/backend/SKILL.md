# SOPFlow Backend Skill

Use this skill for backend implementation in `server/`. It codifies the patterns already used by SOPFlow so new backend work follows existing NestJS/Prisma/domain ownership instead of creating a parallel architecture.

This is a task-specific implementation playbook. Product semantics, architecture boundaries, active milestone state, quality gates, and material decisions remain owned by the canonical `.agents` files.

Before changing behavior, read the affected sections of `PROJECT.md`, `ARCHITECTURE.md`, `CURRENT_ITERATION.md`, `CODE_PATTERNS.md`, `QUALITY.md`, and `DECISIONS.md` as needed.

## Stack

Current backend stack:

```text
NestJS 11
TypeScript strict
Prisma 7
MariaDB
Jest
Docker-backed integration tests where persistence/runtime evidence is required
Swagger decorators on HTTP controllers
JWT cookie authentication
```

Do not introduce another ORM, application framework, validation framework, job system, event bus, or generic workflow engine unless the current requirement explicitly justifies a material architecture change.

## Existing Ownership Model

Default request path:

```text
Controller
  -> Service
       -> Repository / explicit collaborator
            -> Prisma
```

Primary locations:

```text
server/src/modules
  -> domain/use-case modules

server/src/common
  -> cross-cutting infrastructure with real shared ownership

server/prisma/schema.prisma
  -> persistence model

server/prisma/migrations
  -> migration history

server/prisma/DB-INVARIANTS.md
  -> database invariants
```

Put behavior in the narrowest existing owner that can coherently own it.

## Controller Pattern

Controllers own transport, not business policy.

Existing shape:

```ts
@ApiTags('Process Owner Review')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@Controller('process-sop')
@UseGuards(JwtAuthGuard)
export class ProcessOwnerReviewController {
  constructor(private readonly service: ProcessOwnerReviewService) {}

  @Post(':detailOrSopId/review')
  @HttpCode(HttpStatus.OK)
  async review(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('detailOrSopId', ParseUUIDPipe) detailOrSopId: string,
    @Body() dto: ProcessReviewDecisionDto,
  ): Promise<ApiSuccessResponse<unknown>> {
    const data = await this.service.review(req.user, detailOrSopId, dto.decision)
    return { success: true, message: '...', data }
  }
}
```

Controller responsibilities:

- route/method/status semantics;
- parameter/body/query extraction;
- Nest pipes/DTO validation;
- guard/decorator wiring;
- authenticated user context handoff;
- response-envelope mapping;
- Swagger metadata when the surrounding module uses it.

Do not place these in controllers:

- Process authorization policy;
- workflow state machine rules;
- final-authority resolution;
- transaction orchestration;
- complex Prisma queries;
- business branching that belongs to the use case.

## Service Pattern

Services own use cases and policy.

Typical flow:

```text
resolve target entity/context
-> assert contextual permission
-> load current state
-> validate preconditions/invariants
-> resolve collaborators/authority if needed
-> perform atomic transition
-> return current domain/workbench representation
```

Use explicit Nest exceptions for observable domain failures:

```text
NotFoundException
ForbiddenException
ConflictException
BadRequestException / validation boundary where applicable
```

Do not use a broad generic error when the API contract distinguishes missing, forbidden, invalid state, or concurrency conflict.

## Contextual Authorization Pattern

Authorization must answer the capability being exercised.

For Process-bound SOP work, use Process relationship rather than legacy global role identity.

Existing pattern:

```ts
await processContextService.assertCanAuthor(user.sub, processId)
await processContextService.assertCanReview(user.sub, processId)
```

Semantics:

```text
author
  -> Process Owner OR Process Member for this Process

review
  -> Process Owner for this Process

final approval / TTE
  -> resolved organizational authority for this Process scope

platform administration
  -> platformRole capability
```

`SUPER_ADMIN` is not a general workflow bypass.

Always include negative authorization behavior when changing these boundaries.

## Process Context Pattern

Prefer authorization queries that encode the relevant relationship directly and return the context needed by the use case.

Existing style:

```ts
const process = await prisma.process.findFirst({
  where: {
    processId,
    OR: [
      { ownerId: penggunaId },
      { members: { some: { penggunaId } } },
    ],
  },
  include: processInclude,
})

if (process === null) {
  throw new ForbiddenException(...)
}
```

Do not load an unrelated global role and infer Process access from it.

Keep frequently reused selects/includes explicit and typed with `as const` where that is already the local pattern.

## Repository Pattern

Use a repository when persistence behavior has a real cohesive owner, especially when queries/projections are reused or Prisma details would otherwise leak across services.

Repository responsibilities:

- Prisma queries/writes;
- persistence projections/selects/includes;
- persistence-oriented filtering/order;
- reusable atomic persistence helpers;
- mapping persistence identifiers when that mapping is persistence-specific.

Service responsibilities remain:

- why the query is needed;
- whether the user may do it;
- whether current state permits it;
- which transition/side effect is correct.

Do not move policy into a repository merely because Prisma can express the condition.

Direct `PrismaService` use in a service is acceptable where the existing owner is small/explicit and creating a repository would only add indirection. Follow the nearest module pattern.

## DTO / Validation Pattern

Use DTOs for real transport boundaries.

Prefer:

```text
request body DTO
query/param Nest pipes
explicit enum/value validation
response DTO when the shape is a meaningful public/stable contract
```

Do not create one DTO per internal layer when the same shape is not a distinct contract.

Keep generated Prisma types at persistence/domain implementation boundaries; do not expose raw Prisma models as accidental public API contracts when a stable DTO is required.

## Workflow State Pattern

For state-changing workflow operations:

1. resolve the target SOP/detail and Process binding;
2. reject legacy/unbound targets when the target-native endpoint does not own them;
3. assert contextual authorization;
4. read current state;
5. validate state-specific preconditions;
6. calculate the target state/recipient/authority before the write when appropriate;
7. perform compare-and-set style state transition in one transaction when races matter;
8. write audit/history and durable side effects in the same atomic boundary when they must not diverge;
9. emit non-durable realtime signals only after commit.

Existing concurrency pattern:

```ts
await prisma.$transaction(async (tx) => {
  const updated = await tx.detailSOP.updateMany({
    where: {
      detailSopId,
      status: expectedStatus,
    },
    data: {
      status: targetStatus,
      terakhirDieditOlehId: userId,
    },
  })

  if (updated.count !== 1) {
    throw new ConflictException(
      'Status SOP berubah saat aksi diproses. Muat ulang dokumen lalu ulangi keputusan.',
    )
  }

  await appendOrCreateLogSession(...)
  await durableSideEffectInTransaction(...)
})

emitRealtimeSignalAfterCommit()
```

Use this shape when stale concurrent decisions could otherwise produce orphan audit/notification/signing effects.

## Transaction Pattern

One transaction should represent one business atomicity boundary.

Good candidates:

- workflow status + audit + durable notification;
- final approval state + evidence that must not diverge;
- TTE/signing state transitions where database evidence must match the operation;
- version replacement/effective-version invariants;
- Process ownership/team mutations that must stay internally consistent.

Do not wrap unrelated network calls, long computations, or unrelated reads in broad database transactions unless the invariant requires it.

For external/expensive work that cannot safely occur inside the transaction, design the state/evidence boundary explicitly rather than silently assuming atomicity.

## Notification Pattern

Process notifications use target-native persistence, separate from legacy evaluation notification history.

For a workflow event:

```text
resolve intended recipient from Process/authority context
-> include durable notification insert in the same transaction as the transition when orphan delivery would be invalid
-> emit in-app change signal after commit
```

Do not force new Process events into archived legacy `PengajuanEvaluasi` / `JenisPengingatWhatsApp` persistence. The UI bell reads only the Process-native notification source.

## Organizational Authority Pattern

Final approval resolves from Process organizational scope:

```text
FACULTY
  -> active DEAN

DEPARTMENT
  -> active HEAD_OF_DEPARTMENT for that department
```

Use the existing authority resolver/service rather than duplicating the rule in each module.

Do not add arbitrary per-SOP approver configuration or treat unit heads/SUPER_ADMIN as additional approval branches unless the product contract changes explicitly.

## TTE / Signing Pattern

TTE is security/legal-evidence-sensitive.

Keep these boundaries distinct:

```text
credential readiness
!= signing authority
```

When changing TTE behavior, inspect the existing TTE services/repositories and preserve:

- PIN/hash handling;
- encrypted personal P12 handling;
- contextual authority resolution;
- signed artifact evidence;
- effective/version transition semantics;
- public verification behavior.

Never log or expose secrets, PINs, P12 passphrases, ciphertext, private key material, or raw credentials.

Do not claim end-to-end signing correctness from unit tests alone.

## Prisma Pattern

Rules:

- edit `server/prisma/schema.prisma` for canonical schema changes;
- regenerate Prisma client after schema changes;
- inspect generated/raw migration SQL;
- update `server/prisma/DB-INVARIANTS.md` when an invariant changes;
- treat successfully applied shared migrations as immutable by default;
- fix later defects with a new migration;
- prefer additive/reversible migration steps during legacy-to-FTI transition;
- do not fabricate or silently reinterpret historical data.

`pnpm db:fresh` is destructive and requires explicit user authorization.

If migration recovery is required, follow `server/prisma/MIGRATION-RECOVERY.md`; do not substitute `migrate reset` for explicit failed-migration recovery.

## Legacy Compatibility Pattern

Target-domain code should use FTI concepts:

```text
Process
ProcessTeam
ProcessOwner
ProcessMember
OrganizationalAuthority
Dean
HeadOfDepartment
ProcessReview
FinalApproval
```

Legacy persistence/status/role names may remain where compatibility requires them.

When a persisted legacy state has target semantics, document/translate that at the explicit compatibility boundary rather than spreading old product meaning into new services.

For target-native endpoints, fail clearly when a legacy/unbound entity is outside the endpoint's ownership instead of silently applying the wrong workflow.

## Error Message Pattern

Use user/operator-meaningful Indonesian domain messages consistent with surrounding code.

Examples of good message intent:

```text
resource not found
access denied because contextual relationship is missing
state has changed; reload/retry
legacy entity is not bound to Process and remains on compatibility workflow
```

Avoid leaking internal stack/database details.

## Testing Pattern

Service tests should assert behavior and boundary interactions, not private implementation trivia.

Existing useful style:

```text
construct service with focused mocked collaborators
-> invoke public use case
-> assert contextual authorization call
-> assert state transition
-> assert authority resolution when relevant
-> assert durable side effect in transaction
-> assert forbidden/conflict negative case
```

For workflow changes, cover:

- happy path;
- wrong actor/Process denial;
- wrong state;
- stale concurrent transition where relevant;
- correct recipient/authority;
- absence of side effect for revision/failure path;
- persistence/integration behavior when database invariants changed.

Use unit tests for policy/orchestration, Docker integration tests for real persistence/transaction constraints, and Migration Smoke for migration-chain SQL/database invariants.

## Module / Dependency Pattern

Before adding a new service/module:

1. inspect the nearest existing module;
2. reuse existing authority/context/repository services;
3. add the collaborator to the existing cohesive Nest module when ownership matches;
4. create a new module only for a real domain/infrastructure ownership boundary.

Avoid circular dependencies, generic shared service dumping grounds, and duplicate policy services.

## Logging / Audit

Business audit evidence and operational logs are different concerns.

- use domain audit/history tables/helpers for durable workflow evidence;
- use application logging for operational diagnosis;
- do not assume a log line is sufficient business/legal evidence;
- do not duplicate audit writes outside the atomic transition when they must correspond exactly to the state change.

## Implementation Workflow

For a backend task:

```text
1. Read affected product/architecture/decision constraints.
2. Inspect the nearest controller/service/repository/test pattern.
3. Identify the behavior owner and authorization dimension.
4. Define current-state preconditions and target transition.
5. Reuse existing context/authority/persistence collaborators.
6. Keep the change vertical and smallest coherent.
7. Add/update focused service/domain tests, including negative paths for authorization/state.
8. Use transaction/CAS semantics when concurrent decisions can matter.
9. Run focused tests + typecheck; add Prisma/integration/migration/TTE gates according to QUALITY.md.
10. Report only evidence collected for the exact revision.
```

## Do Not

- put core business policy in controllers;
- infer Process authorization from legacy global roles;
- use `SUPER_ADMIN` as a workflow bypass;
- duplicate final-authority resolution in multiple services;
- move service policy into repositories for convenience;
- emit durable side effects outside the state transaction when atomicity is required;
- perform broad transactions without a business invariant;
- introduce generic workflow/approval engines for the current two-level model;
- rewrite applied migration history casually;
- use destructive reset for migration recovery;
- expose TTE/secrets/stack details;
- propagate legacy OPD/evaluator semantics into new target-domain abstractions;
- refactor unrelated modules while delivering a bounded backend change.
