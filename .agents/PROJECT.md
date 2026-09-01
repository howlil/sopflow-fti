# SOPFlow Project Profile

## Purpose

SOPFlow is an SOP lifecycle system for Fakultas Teknologi Informasi (FTI). The product manages SOP creation, process-level review, formal approval, publication, verification, and version lifecycle.

The target product domain is FTI, not the legacy Indonesian government OPD model that still exists in parts of the implementation.

This file is the durable project/domain source of truth for repository agents. Current sprint state belongs in `CURRENT_ITERATION.md`; engineering execution rules belong in `AGENTS.md`; commands and verification details belong in `DEVELOPMENT.md`.

## Product Domain Direction

Do not model FTI as one flat organization where every SOP is owned and approved by the Dean.

FTI SOP responsibility is process-oriented and contextual:

- Every SOP belongs to a business/operational process.
- Every process has a Process Team.
- Every Process Team has exactly one Process Owner and one or more members.
- Process Owner and members may initiate and author SOPs for their process.
- Review/evaluation is owned by the Process Owner of that process; there is no required centralized evaluator organization.
- Final approval is derived from the process's organizational scope.
- There are exactly two final approval levels in the current product model:
  - faculty-level process -> Dean (`Dekan`)
  - department-level process -> Head of Department (`Kepala Departemen` / `Kadep`)
- Units below a faculty or department do not introduce another final-approval tier.

Core mental model:

`Organizational Scope -> Process -> Process Team -> SOP -> Process Owner Review -> Contextual Final Approval`

Do not collapse process ownership, authorship, review, organizational position, and final approval into one role.

## Canonical Organizational Model

### FTI

FTI is the top-level product context.

Do not introduce multi-faculty tenancy, cross-university tenancy, or generic organization SaaS abstractions unless explicitly requested. The current product is being designed for the FTI operational domain.

### Organizational Scope

A process belongs to one canonical approval scope:

- `FACULTY`
- `DEPARTMENT`

The scope determines the final approval authority.

Approval rule:

```text
FACULTY
  -> DEKAN

DEPARTMENT
  -> KEPALA_DEPARTEMEN
```

This is a domain invariant unless the user explicitly changes the product rule.

### Faculty Scope

Faculty-level processes may be operated by faculty units such as:

- Tata Usaha / administration
- Bagian SDM
- Bagian Keuangan
- Bagian Umum dan Pengelolaan Aset
- Unit TI
- Unit Kerja Sama
- Unit K3L
- faculty academic/administrative teams
- other faculty-level process teams represented in the FTI process catalog

A faculty-level unit may own or operate a process, but the final approver remains the Dean.

Example:

```text
Bagian Keuangan
  -> Process Team RKAT
  -> Process Owner + Members
  -> author/review workflow
  -> DEKAN approval
```

A unit head is not automatically a new final approval authority merely because the unit has internal leadership.

### Department Scope

Department-level processes belong to a specific department context and are finally approved by that department's Head of Department.

Department-level process examples observed in the FTI process catalog include:

- Tugas Akhir
- Kerja Praktik
- MBKM
- Praktikum
- laboratory operations
- selected CPL/assessment processes
- course portfolio/documentation processes

Example:

```text
Departemen
  -> Process Team Tugas Akhir
  -> Process Owner + Members
  -> author/review workflow
  -> KEPALA DEPARTEMEN approval
```

### Units Are Not Approval Levels

A unit is an operational/organizational grouping. It does not create a third approval level.

Canonical resolution:

```text
faculty-level unit
  -> FACULTY scope
  -> DEKAN

department-level unit/process
  -> DEPARTMENT scope
  -> KEPALA DEPARTEMEN
```

Do not implement generic `Unit Head -> approval` behavior unless the user explicitly changes the two-level approval rule.

## Canonical Process Model

### Process

A Process represents an FTI business or operational process for which SOPs are created and maintained.

Conceptually a Process owns:

- process identity/name
- organizational scope (`FACULTY` or `DEPARTMENT`)
- department context when scope is `DEPARTMENT`
- optional operating unit/context when useful
- one Process Owner
- one or more Process Team members
- SOPs belonging to the process

A Process is not the same thing as an organizational unit. One organizational unit can operate multiple processes, and one department can contain many Process Teams.

Examples:

```text
Departemen TI
  -> Process: Tugas Akhir
  -> Process: Kerja Praktik
  -> Process: MBKM
  -> Process: Praktikum
```

```text
Faculty scope
  -> Process: Pengelolaan SDM
  -> Process: Pengelolaan Keuangan
  -> Process: Layanan TI
  -> Process: Kerja Sama
```

### Process Team

Every Process must have a Process Team.

Canonical composition:

```text
Process Team
  -> exactly one Process Owner
  -> one or more Members
```

The Process Owner is the accountable workflow actor for the process. Members participate in authoring and process execution.

Do not model Process Owner as a centralized faculty-wide evaluator role.

### Process Owner

Process Owner is contextual to one process.

Responsibilities in the target SOP workflow:

- accountable for the process
- may initiate an SOP
- may author/edit an SOP
- receives/reviews SOP submissions for that process
- accepts the SOP for formal approval or sends it back for revision

A person may be Process Owner for one process while being a normal member or unrelated user in another process.

Do not treat `PROCESS_OWNER` as a global organizational title equivalent to Dean, Head of Department, or a central quality office.

### Process Member

Members belong to a Process Team.

Members may:

- initiate SOP work for their process
- draft/edit SOP content according to workflow permissions
- participate in the process-specific authoring workflow

Membership is contextual. Being a member of one Process Team must not automatically grant author/review rights to unrelated processes.

## Global Procedure Actor Catalog

`Pelaksana` is the canonical reusable vocabulary for procedure/swimlane actors such as `Dosen`, `Mahasiswa`, or `Admin Akademik`.

Catalog identity is global to the FTI application. A Pelaksana catalog row is not owned by an OPD, Department, Faculty, Process, Process Team, or individual SOP.

Canonical separation:

```text
Global Pelaksana Catalog
  -> reusable actor identity / current label

SOP Version
  -> selects Pelaksana entries as swimlanes
  -> snapshots the actor labels used by that version

Procedure Step
  -> may reference only an actor selected by that same SOP version
```

Rules:

- Process/organizational scope determines who may author the SOP, not which Pelaksana catalog entries exist.
- Any active authenticated user may create or edit Pelaksana catalog entries; this permission does not make the user a Process Owner, reviewer, or approver.
- New catalog mutations must retain actual creator/latest-editor attribution. Unknown legacy attribution remains unknown rather than being fabricated.
- Historical/versioned SOP rendering must use its stable actor-label snapshot. Renaming a global catalog entry must not rewrite wording in an already snapshotted SOP version.
- Usage of a Pelaksana belongs to the SOP-version/swimlane relationship; it does not transfer ownership of the global catalog row to that Process or SOP.
- A procedure step may use a Pelaksana only when that actor is selected as a swimlane for the same SOP version.
- Exact duplicates may be consolidated when identity is unambiguous after normalized comparison. Do not fuzzy-merge merely similar actor labels.
- Legacy `Pelaksana.opdId`, while it remains physically present during migration, is a compatibility shadow rather than target ownership or authorization semantics.

## Workflow Actors vs Organizational Positions

Keep workflow capability separate from organizational position.

Target concepts:

```text
AUTHOR
REVIEWER / PROCESS_REVIEW
APPROVER
```

These are capabilities in a workflow, not necessarily global user roles.

Current domain mapping:

- Author capability -> Process Owner or Process Team Member as allowed by the workflow.
- Review capability -> Process Owner for the SOP's process.
- Final approval capability -> resolved from organizational scope:
  - Faculty -> Dean
  - Department -> Head of Department

Organizational titles such as Dean and Head of Department define authority. They are not substitutes for Process Owner.

## Platform Administration And Super Admin

`SUPER_ADMIN` is a platform/system administration role. It is not an SOP workflow role, Process Team role, organizational title, or final-approval authority.

Keep these authorization dimensions separate:

```text
Platform Role
  -> SUPER_ADMIN | USER

Process Relationship
  -> PROCESS_OWNER | MEMBER | none

Organizational Authority
  -> DEAN | HEAD_OF_DEPARTMENT | none
```

A user may hold values in more than one dimension, but each permission must come from the relevant dimension.

### Super Admin Responsibilities

The target product may use `SUPER_ADMIN` for platform administration such as:

- creating, updating, activating, or deactivating user accounts;
- maintaining faculty/department organizational configuration required by the application;
- maintaining Process definitions and administrative process metadata;
- assigning or changing Process Owners and Process Team Members;
- maintaining which user currently holds the Dean or Head-of-Department authority when that configuration is administered through the application;
- performing explicit system-maintenance/configuration operations required to keep the application operable.

These responsibilities are administrative. They do not make the Super Admin the business owner of the affected SOPs or processes.

### Super Admin Is Not Workflow Authority

`SUPER_ADMIN` must not act as a god role that implicitly bypasses SOP workflow policy.

A user who has only `SUPER_ADMIN` must not automatically gain permission to:

- author or edit an SOP outside a Process Team relationship;
- review/accept/reject an SOP as Process Owner;
- act as Dean or Head of Department;
- perform final SOP approval;
- sign final TTE as Dean or Head of Department;
- force an SOP into `BERLAKU` by bypassing the approved workflow;
- impersonate another workflow actor merely because the user can administer accounts or assignments.

Canonical invariant:

```text
SUPER_ADMIN
  != PROCESS_OWNER
  != PROCESS_MEMBER
  != DEAN
  != HEAD_OF_DEPARTMENT
  != workflow bypass
```

If the same person is both Super Admin and Dean, the person receives faculty final-approval authority because that user currently holds the `DEAN` organizational authority, not because of `SUPER_ADMIN`.

Likewise, a Super Admin who is separately assigned as a Process Owner receives process-review authority from that Process assignment.

Authorization checks should therefore reason about the permission being exercised rather than using `SUPER_ADMIN` as a universal override.

### Administrative Repair Boundary

If an exceptional administrative repair is ever required, model it as an explicit administrative operation with appropriate audit evidence rather than silently impersonating Process Owner, Dean, or Head of Department behavior.

Do not use administrative repair capability to synthesize legal/TTE approval history that did not actually occur.

The exact human identity, number of Super Admin accounts, and operational assignment procedure are not yet canonical unless explicitly established later.

## Evaluation / Review Model

The target domain does not require a centralized `Evaluator` entity, evaluator department, or globally assigned evaluator team.

Evaluation is a process-local review step.

Canonical rule:

```text
SOP belongs to Process X
  -> Process Owner X performs the process review
```

The system should therefore reason about `review capability for this process/SOP`, not `user globally has evaluator identity`.

Legacy `EVALUATOR` and `PJ_EVALUATOR` concepts are implementation-era government-domain concepts and must not be treated as canonical FTI product roles during the refactor.

No additional separation-of-duties invariant has been approved between author and Process Owner. In particular, do not invent a rule such as `authorUserId != reviewerUserId` unless the user explicitly requests it. If a Process Owner authors an SOP, current product direction does not by itself require a separate central evaluator.

## Canonical SOP Lifecycle

The target lifecycle should preserve the useful behavior of the existing SOP state machine while replacing government-specific role semantics.

Conceptual flow:

```text
Process Owner / Member
        |
        v
     INITIATE
        |
        v
       DRAFT
        |
        v
 SUBMIT FOR REVIEW
        |
        v
 PROCESS OWNER REVIEW
    |             |
    | revision    | accepted
    v             v
   DRAFT    READY FOR APPROVAL
                  |
                  v
          resolve final approver
             /           \
            /             \
       FACULTY         DEPARTMENT
          |                 |
        DEKAN              KADEP
            \             /
             \           /
                  v
               BERLAKU
```

Required behavioral principles:

1. SOP authoring is scoped to its Process Team.
2. A Process Owner controls process review.
3. Review can return an SOP for revision.
4. Accepted review moves the SOP toward formal approval.
5. Final approver is deterministic from organizational scope.
6. Faculty-level SOPs are approved by the Dean.
7. Department-level SOPs are approved by the relevant Head of Department.
8. Units do not create additional final approval tiers.
9. Existing version/publication integrity such as one current effective version, replacement of the previous effective version, revocation, audit history, TTE evidence, and public verification should be preserved unless explicitly changed.

The exact persisted status names may temporarily remain legacy during migration. Product behavior is more important than performing a blind status rename.

## Approval Resolution

Approval should be contextual rather than globally hard-coded to the legacy `KEPALA_OPD` role.

Conceptual resolver:

```text
resolveFinalApprover(sop.process.scope)

FACULTY
  -> active Dean authority

DEPARTMENT
  -> active Head of Department for sop.process.department
```

The resolver may use existing authorization/TTE infrastructure during migration, but the product rule above is canonical.

Do not make each Process, Unit, or SOP manually configure an arbitrary final approver when the authority can be derived from scope. Avoid duplicated approval state unless a concrete requirement requires an exception.

`SUPER_ADMIN` must not be treated as an additional branch of this resolver. Final approval still resolves only through the Faculty/Department authority rule.

## Responsibility Labels and Multiple Units

The FTI source catalog contains responsibility labels such as:

- `Fakultas`
- `Departemen`
- `Departemen/Fakultas`
- `Fakultas/Tata Usaha Fakultas`
- `Unit TI/Fakultas`
- `Tata Usaha/Fakultas`
- `Unit Kerja Sama/Fakultas`
- `Unit K3L/Fakultas`

Do not infer multiple final approvers from these labels.

For workflow authorization, every Process still needs one canonical approval scope. Additional units may represent collaboration, execution responsibility, or source-document metadata without creating another approval tier.

If a source row does not make the canonical scope clear, preserve the ambiguity as data/discovery work rather than inventing a new approval model.

## FTI Process Catalog Evidence

The current domain direction is informed by the FTI source spreadsheet `List Proses Bisnis FTI`, especially the final document register tab `Daftar Induk Dokumen by Proses Bisnis (Final)`.

Observed examples include:

### Faculty-context examples

- Mahasiswa Baru -> Fakultas
- Registrasi ulang dan Penasehat Akademik -> Fakultas
- Penetapan/Peninjauan Kurikulum -> Fakultas
- Pengelolaan Data Alumni -> Fakultas/Tata Usaha Fakultas
- Akses email institusi dan SSO -> Unit TI/Fakultas
- Pengangkatan Pegawai Tetap -> Bagian SDM
- Mutasi internal -> Bagian SDM
- Penyusunan RKAT -> Bagian Keuangan
- Inisiasi/Pengelolaan Kerja Sama -> Unit Kerja Sama/Fakultas
- K3 Fakultas -> Unit K3L/Fakultas

These remain `FACULTY` approval scope unless later product/source evidence establishes otherwise, so final approval resolves to the Dean.

### Department-context examples

- Pelaksanaan Asesmen Capaian Pembelajaran -> Departemen
- Dokumentasi Portofolio Mata Kuliah -> Departemen
- Penetapan Dosen Pembimbing Kerja Praktik -> Departemen
- Penilaian Kerja Praktik -> Departemen
- Penetapan Dosen Pembimbing MBKM -> Departemen
- Konversi/Rekognisi MBKM -> Departemen
- Penilaian MBKM -> Departemen
- Pendaftaran/Pelaksanaan Tugas Akhir -> Departemen
- Seminar/Sidang Tugas Akhir -> Departemen
- Pelaksanaan Praktikum -> Departemen
- Ujian Akhir Praktikum -> Departemen
- Penerimaan Asisten -> Departemen
- selected laboratory processes -> Departemen or Departemen/Fakultas in source data

Canonical department-scoped processes resolve final approval to the relevant Head of Department.

The source catalog is evidence for process ownership; it is not by itself a complete authorization specification. Apply the explicit product rules in this file when source labels are ambiguous.

## Target Domain Invariants

Treat these as canonical unless explicitly changed by the user:

1. FTI is the product domain context.
2. Every SOP belongs to one Process.
3. Every Process has exactly one Process Owner.
4. Every Process has one or more Process Team Members.
5. Process Owner and Process Members are contextual assignments, not global organization-wide powers.
6. Process Owner or authorized Process Members may initiate/author SOPs for their process.
7. Process review is owned by that Process Owner.
8. No centralized evaluator organization is required by the target domain.
9. Final approval has exactly two levels: Faculty and Department.
10. Faculty scope always resolves final approval to the Dean.
11. Department scope always resolves final approval to the relevant Head of Department.
12. Faculty/department sub-units do not create additional final approval levels.
13. Organizational unit, Process Owner, author, reviewer, and final approver are distinct concepts even when one person happens to fulfill multiple capabilities.
14. Do not add generic multi-level approval configuration without an explicit product requirement.
15. Do not add a global evaluator/PJ evaluator model merely to preserve legacy implementation shape.
16. Existing SOP publication/version/TTE/audit invariants should survive the domain refactor unless explicitly changed.
17. `SUPER_ADMIN` is a platform-administration role, not a workflow or organizational authority.
18. `SUPER_ADMIN` alone does not grant Process authoring, Process review, final approval, or final-TTE permission.
19. When a Super Admin also holds a Process or organizational authority, workflow permission derives from that separate assignment/authority.
20. Super Admin must not be an implicit fallback from Faculty/Department final-approver resolution.
21. Exceptional administrative repair must remain explicit/audited and must not fabricate workflow/TTE history.
22. `Pelaksana` catalog identity is global and reusable; it is not owned by OPD, Faculty, Department, Process, Process Team, or SOP.
23. Selection of a Pelaksana into an SOP version is a usage relationship, not catalog ownership.
24. Procedure steps may reference only Pelaksana selected into the same SOP version's swimlane set.
25. Historical SOP versions use snapshotted Pelaksana labels; later catalog renames must not rewrite historical/versioned wording.
26. New Pelaksana mutations retain actual creator/latest-editor attribution; unknown legacy attribution stays unknown.
27. Active authenticated users may maintain the global Pelaksana catalog without gaining Process review or approval authority from that maintenance permission.
28. Legacy `Pelaksana.opdId` is a compatibility shadow until contract cleanup, not target authorization or ownership.
29. Duplicate Pelaksana consolidation must be identity-safe; exact normalized duplicates may consolidate, but fuzzy/ambiguous near-duplicates must not be auto-merged.

## Legacy Implementation vs Target Domain

The repository currently contains substantial OPD/government-specific vocabulary and authorization assumptions. Treat these as migration inputs, not target product truth.

Important legacy concepts include:

- `OPD`
- `opdId`
- `RiwayatOpdPengguna`
- `OPDPeraturan`
- `KEPALA_OPD`
- `PENYUSUN`
- `PJ_PENYUSUN`
- `EVALUATOR`
- `PJ_EVALUATOR`
- `PengajuanEvaluasi`
- `nilaiOPD`
- OPD-scoped public archive routes
- OPD-scoped authorization, notification copy, PDFs, DTOs, tests, seeds, and TTE role names

Do not perform a mechanical search/replace such as:

```text
OPD -> Fakultas
KEPALA_OPD -> DEKAN
```

That mapping is incorrect because legacy OPD combines several concerns that the FTI model separates.

### Conceptual Migration Mapping

| Legacy concept | Target meaning/direction |
| --- | --- |
| `OPD` | Split into organizational/process context; not equivalent to Faculty |
| `opdId` on SOP | Process ownership/scope relationship, not simply `fakultasId` |
| `KEPALA_OPD` | Contextual final approver resolved as Dean or Head of Department |
| `PENYUSUN` | Authoring capability within a Process Team |
| `PJ_PENYUSUN` | Legacy coordination/submission role; responsibilities should be absorbed into Process Owner/workflow capabilities where appropriate |
| `EVALUATOR` | Remove as global product role; process review belongs to Process Owner |
| `PJ_EVALUATOR` | Remove as global product role unless a future explicit requirement introduces a separate quality-review layer |
| `PengajuanEvaluasi` | Process review/review-cycle concept; preserve useful state/audit behavior without government-specific semantics |
| `nilaiOPD` | Legacy vocabulary; rename only when the retained business meaning is understood |
| OPD archive grouping | Replace based on final FTI process/scope/public navigation design, not by blind rename |

Physical database/API migration strategy is not defined by this table. Public contract changes, destructive migrations, and material data-ownership changes must follow the stop/approval rules in `AGENTS.md`.

## Domain Refactor Guardrails

When implementing the FTI refactor:

- Preserve the existing useful SOP state-machine behavior unless the user explicitly changes it.
- Replace domain semantics before broad cosmetic renames.
- Do not preserve a centralized evaluator architecture solely because legacy code has evaluator modules/pages.
- Do not make the Dean a universal approver.
- Do not make arbitrary unit heads final approvers.
- Do not create a third approval level.
- Do not create generic configurable approval chains without explicit need.
- Do not introduce a generic RBAC/ABAC framework merely to model the current rules if a smaller contextual authorization model is sufficient.
- Prefer explicit process membership and scope-derived authorization.
- Keep `SUPER_ADMIN` platform administration separate from Process/approval authorization rather than creating an all-permissions bypass.
- Keep migrations reversible/non-destructive when possible.
- Preserve TTE/audit/legal evidence across role/domain renames.
- Preserve public-document verification behavior.
- Update database invariant documentation together with any persistence invariant change.
- Update tests around cross-process and cross-department authorization when the new boundaries are implemented.

## Authorization Boundaries To Verify During Refactor

The target authorization boundary is process-contextual and authority-specific.

At minimum, future implementation should make these denial cases testable:

- A member of Process A must not gain authoring rights to Process B merely because both are in the same faculty.
- A Process Owner of Process A must not gain review rights to Process B unless separately assigned.
- A Head of Department must not approve a faculty-scoped SOP merely due to being a department authority.
- A Head of Department must not approve an SOP owned by another department.
- The Dean must not accidentally become the process reviewer for every faculty process merely because the Dean is the final faculty approver.
- A faculty-level unit must resolve final approval to the Dean, not to an invented unit-level final approver.
- A department-level process must resolve final approval to the relevant Head of Department.
- A Super Admin with no Process Team relationship must not gain authoring or Process Owner review rights.
- A Super Admin who is neither the active Dean nor the relevant Head of Department must not final-approve or final-sign an SOP.
- Assigning Process/organizational authority as an administrative action must not implicitly assign that same authority to the Super Admin performing the assignment.
- Super Admin administration must not provide a hidden path that forces `BERLAKU` without the normal final authority/TTE evidence.

These describe target authorization semantics; implementation may temporarily retain legacy guards while the migration is incomplete.

## Intentionally Not Yet Canonical

Do not guess these product rules until explicitly established by user intent or authoritative FTI process evidence:

- Whether author and Process Owner reviewer must always be different people.
- Whether Process Owner review may be delegated to selected Process Team Members.
- Whether a process can have multiple simultaneous Process Owners; current rule is exactly one.
- Whether a Process may span more than one department.
- How ambiguous `Departemen/Fakultas` source rows should be assigned when one canonical approval scope is required.
- Exact names and complete membership of every faculty unit/department.
- The exact human identity, number, and operational assignment procedure for Super Admin accounts.
- Whether Super Admin needs global read access to all SOP content beyond specific administrative/audit use cases.
- Whether all existing evaluation scores/graphs remain meaningful after centralized evaluator semantics are removed.
- Exact replacement vocabulary for every legacy database field, DTO, route, notification kind, PDF label, and historical record.
- Whether legacy external API compatibility must be maintained during domain migration.

Surface these only when they become necessary for the requested vertical slice. Do not turn them into speculative architecture work.

## Observed Runtime

The root Compose file defines:

- `db`: MariaDB 11.4 with persistent `db_data`.
- `backend`: NestJS service built from `server/Dockerfile`, internal port `3001`, runs Prisma migrations and initial seed before `pnpm start:prod`.
- `frontend`: Vite/React production server behind Nginx-style frontend image, internal port `8080`, depends on backend readiness.
- `sop_pdf_data`: persistent PDF artifact volume mounted at `/app/storage/sop-pdf`.

Public ingress should normally target the frontend service only. Backend and database are internal runtime services unless deployment infrastructure explicitly says otherwise.

## Frontend Map

- `client/src/routes`: TanStack Router file routes.
- `client/src/pages`: role and workflow pages.
- `client/src/components`: shared and domain-specific React components.
- `client/src/components/ui`: reusable UI primitives.
- `client/src/api`: endpoint wrappers and domain API modules.
- `client/src/lib`: domain helpers, mappers, print/PDF helpers, query helpers, status config.
- `client/src/stores`: Zustand stores.
- `client/e2e`: Playwright journeys and business-flow coverage.

Legacy workflow surfaces that will require deliberate FTI-domain migration include:

- `pages/penyusun`: legacy SOP authoring role surfaces.
- `pages/kepala-opd`: legacy single organizational-head approval surfaces.
- `pages/evaluator` and `pages/pj-evaluator`: legacy centralized evaluation-role surfaces.
- `pages/public` and `pages/validasi`: public archive and PDF/TTE validation.

Do not infer target FTI roles from those directory names.

## Backend Map

- `server/src/main.ts`: Nest bootstrap.
- `server/src/app.module.ts`: module composition.
- `server/src/common`: shared auth, guards, HTTP security, Prisma, pagination, status, date, logging.
- `server/src/modules/core`: auth, user/role/legacy OPD/person master data.
- `server/src/modules/sop`: SOP catalog, procedure, diagram, PDF artifacts, public access, collaboration logs.
- `server/src/modules/evaluation`: current legacy evaluation submissions/workspace/scoring/feedback/graphs; target domain should evolve toward process-local review semantics.
- `server/src/modules/tte`: TTE profile, signing, verification, shared credential handling.
- `server/src/modules/notifications`: in-app notifications and reminder reconciliation.
- `server/prisma`: Prisma schema, migrations, seed, and database invariant notes.

Module names are current implementation facts, not mandatory target architecture. Apply the minimum-change/design rules in `AGENTS.md` when deciding whether responsibilities should be extended, renamed, or moved during the refactor.

## Package Managers

Both `client/package.json` and `server/package.json` declare `pnpm@11.21.0`. Prefer `pnpm` inside the relevant package directory.

## Environment

Root `.env` is used by Compose. Backend also has `server/.env` and `server/.env.test` in this checkout. Treat any existing env file as local state; do not expose values in responses.

Required production-style values include:

- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `TTE_ENCRYPTION_SECRET`
- `PUBLIC_APP_ORIGIN`

## Known Checkout Notes

- README references `docs/*`, but no root `docs` folder is present in the current repository root listing.
- `client/playwright-report` and `client/test-results` may exist locally as generated artifacts.