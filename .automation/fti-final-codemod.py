from __future__ import annotations

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
changed: list[str] = []
deleted: list[str] = []


def p(rel: str) -> Path:
    return ROOT / rel


def write(rel: str, content: str) -> None:
    target = p(rel)
    target.parent.mkdir(parents=True, exist_ok=True)
    old = target.read_text(encoding='utf-8') if target.exists() else None
    if old != content:
        target.write_text(content, encoding='utf-8')
        changed.append(rel)


def edit(rel: str, fn) -> None:
    target = p(rel)
    if not target.exists():
        return
    old = target.read_text(encoding='utf-8')
    new = fn(old)
    if new != old:
        target.write_text(new, encoding='utf-8')
        changed.append(rel)


def replace(rel: str, mapping: dict[str, str]) -> None:
    def apply(text: str) -> str:
        for a, b in mapping.items():
            text = text.replace(a, b)
        return text
    edit(rel, apply)


def remove(rel: str) -> None:
    target = p(rel)
    if target.exists():
        target.unlink()
        deleted.append(rel)


def remove_tree(rel: str) -> None:
    target = p(rel)
    if not target.exists():
        return
    for child in sorted(target.rglob('*'), reverse=True):
        if child.is_file():
            deleted.append(child.relative_to(ROOT).as_posix())
            child.unlink()
        elif child.is_dir():
            child.rmdir()
    target.rmdir()


# Client: finish native status / activity / TTE contract consumers.
for rel in [
    'client/src/pages/penyusun/sop/components/RiwayatStatusPanel.tsx',
    'client/src/pages/penyusun/sop/detail/DetailSOPPenyusun.tsx',
    'client/src/pages/penyusun/sop/detail/components/DetailSopPenyusunHeader.tsx',
    'client/src/pages/penyusun/sop/detail/components/DetailSopPenyusunMain.tsx',
    'client/src/pages/penyusun/sop/detail/components/__tests__/DetailSopPenyusunHeader.test.tsx',
]:
    replace(rel, {
        'EVALUASI': 'REVIEW',
        'BERLAKU': 'EFFECTIVE',
        'tteSignaturePayloadKepalaOpd': 'tteSignaturePayload',
    })

edit(
    'client/src/pages/public/arsip/hooks/use-arsip-browse.ts',
    lambda t: re.sub(r'^\s*opd(?:Id|Page): undefined,\n', '', t, flags=re.MULTILINE),
)

# Remove stale organization wording from the now-global regulation DTO.
replace(
    'server/src/modules/core/peraturan/dto/create-peraturan.dto.ts',
    {'/** Input pembuatan master peraturan + tautan ke OPD pengguna (opdId di-set server). */':
     '/** Input pembuatan peraturan global untuk katalog FTI. */'},
)

# Generic fixture cleanup: contracted models no longer contain these columns.
for target in list(p('server/src').rglob('*.spec.ts')):
    rel = target.relative_to(ROOT).as_posix()
    def clean_columns(text: str) -> str:
        text = re.sub(r'^\s*(?:opdId|sopOpdId|pengajuanEvaluasiId):[^\n]*\n', '', text, flags=re.MULTILINE)
        text = text.replace("'opd/sop/v2.pdf'", "'process/sop/v2.pdf'")
        return text
    edit(rel, clean_columns)

# Native Process review fixture: identity has no workflow role.
def clean_owner_review(text: str) -> str:
    text = re.sub(r'^\s*PeranPengguna,\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*peran: PeranPengguna\.[A-Z_]+,\n', '', text, flags=re.MULTILINE)
    text = re.sub(r',\s*opdId: [^,}]+', '', text)
    return text
edit('server/src/modules/sop/process-authoring/process-owner-review.service.spec.ts', clean_owner_review)

# Process TTE: authority is carried by final-approval context, never a global role.
def clean_process_tte_service(text: str) -> str:
    text = re.sub(r'^\s*PeranPengguna,\n', '', text, flags=re.MULTILINE)
    text = text.replace('menyimpan historical signature role tanpa membaca Pengguna.peran', 'menyimpan contextual signing authority')
    text = re.sub(r'expect\.objectContaining\(\{ userId: user\.sub, peran: PeranPengguna\.KEPALA_OPD \}\)',
                  "expect.objectContaining({ userId: user.sub })", text)
    text = re.sub(r'expect\.objectContaining\(\{ peran: PeranPengguna\.KEPALA_OPD \}\)',
                  "expect.objectContaining({ userId: user.sub })", text)
    return text
edit('server/src/modules/tte/penandatanganan/process-tte.service.spec.ts', clean_process_tte_service)


def clean_process_tte_repo(text: str) -> str:
    text = re.sub(r'^\s*PeranPengguna,\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*peran: PeranPengguna\.[A-Z_]+,\n', '', text, flags=re.MULTILINE)
    return text
edit('server/src/modules/tte/penandatanganan/process-tte.repository.spec.ts', clean_process_tte_repo)

# Lightweight current-user specs: remove obsolete global-role fixture fields/imports.
for rel in [
    'server/src/modules/core/auth/auth.controller.spec.ts',
    'server/src/modules/sop/diagram/sop-diagram.service.spec.ts',
    'server/src/modules/sop/process-authoring/process-bound-sop.guard.spec.ts',
    'server/src/modules/tte/core/tte.controller.spec.ts',
    'server/src/modules/tte/profil/tte-profil-pin-rotation.spec.ts',
]:
    def clean_role_fixture(text: str) -> str:
        text = re.sub(r"import \{\s*PeranPengguna\s*\} from '[^']+';\n", '', text)
        text = re.sub(r'\bPeranPengguna,\s*', '', text)
        text = re.sub(r',\s*PeranPengguna\b', '', text)
        text = re.sub(r'^\s*peran: PeranPengguna\.[A-Z_]+,\n', '', text, flags=re.MULTILINE)
        text = text.replace('KEPALA_OPD', 'DEAN')
        return text
    edit(rel, clean_role_fixture)

# Profile service helper used to parameterize a removed role axis.
def clean_profile_spec(text: str) -> str:
    text = re.sub(r"import \{\s*PeranPengguna\s*\} from '[^']+';\n", '', text)
    text = re.sub(r'\bPeranPengguna,\s*', '', text)
    text = re.sub(r',\s*PeranPengguna\b', '', text)
    text = re.sub(r'function pengguna\(peran: PeranPengguna = PeranPengguna\.[A-Z_]+\)', 'function pengguna()', text)
    text = re.sub(r'pengguna\(PeranPengguna\.[A-Z_]+\)', 'pengguna()', text)
    text = re.sub(r'^\s*peran,\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*peran: PeranPengguna\.[A-Z_]+,\n', '', text, flags=re.MULTILINE)
    text = text.replace('KEPALA_OPD', 'DEAN').replace('PJ_EVALUATOR', 'DEAN').replace('PJ_PENYUSUN', 'HEAD_OF_DEPARTMENT')
    return text
edit('server/src/modules/tte/profil/tte-profil.service.spec.ts', clean_profile_spec)

# PDF-signing / public-verification evidence is authority-native.
for rel in [
    'server/src/modules/tte/penandatanganan/tte-pdf-signing.service.spec.ts',
    'server/src/modules/tte/verifikasi/tte-verifikasi.service.spec.ts',
]:
    def authority_spec(text: str) -> str:
        text = text.replace('PeranPengguna', 'OrganizationalAuthority')
        text = text.replace('OrganizationalAuthority.KEPALA_OPD', 'OrganizationalAuthority.DEAN')
        text = text.replace('OrganizationalAuthority.PJ_EVALUATOR', 'OrganizationalAuthority.DEAN')
        text = text.replace('OrganizationalAuthority.PJ_PENYUSUN', 'OrganizationalAuthority.HEAD_OF_DEPARTMENT')
        text = text.replace('OrganizationalAuthority.PENYUSUN', 'OrganizationalAuthority.DEAN')
        text = text.replace('OrganizationalAuthority.EVALUATOR', 'OrganizationalAuthority.HEAD_OF_DEPARTMENT')
        text = re.sub(r'OrganizationalAuthority,\s*OrganizationalAuthority,', 'OrganizationalAuthority,', text)
        text = re.sub(r'^\s*peran:', lambda m: m.group(0).replace('peran', 'authority'), text, flags=re.MULTILINE)
        text = text.replace('KEPALA_OPD', 'DEAN').replace('PJ_EVALUATOR', 'DEAN').replace('PJ_PENYUSUN', 'HEAD_OF_DEPARTMENT')
        return text
    edit(rel, authority_spec)

# Repository spec current-user selection no longer includes organization shadows.
# Other simple specs already lost opdId lines above.

# The old negative-boundary spec duplicated the executable whole-tree audit.
remove('server/src/modules/sop/process-authoring/native-fti-boundary.spec.ts')

# Retire the old schema/global-role integration world. Migration Smoke + FTI DB audit replace it.
remove_tree('server/test/integration')
remove('server/test/jest-integration.json')

# Update package test surface: no retired integration or duplicate boundary suite.
def clean_package(text: str) -> str:
    data = json.loads(text)
    scripts = data['scripts']
    scripts['test:core-unit'] = scripts['test:core-unit'].replace(' native-fti-boundary.spec.ts', '')
    scripts['test:fti-exit'] = scripts['test:fti-exit'].replace(' native-fti-boundary.spec.ts', '')
    for key in ['test:integration', 'test:integration:run', 'test:integration:docker']:
        scripts.pop(key, None)
    return json.dumps(data, indent=2, ensure_ascii=False) + '\n'
edit('server/package.json', clean_package)

# Canonical repository knowledge: FTI-only current truth. Historical SQL remains self-describing.
write('.agents/CURRENT_ITERATION.md', '''# CURRENT ITERATION\n\n## State\n\nThe repository is completing the final FTI-only cleanup after persistence contraction.\n\nCurrent target runtime:\n- identity: `Pengguna` + `PlatformRole`;\n- organization: `Department` and `Process`;\n- workflow relationship: Process Owner / Process Member;\n- legal signing authority: `DEAN` or `HEAD_OF_DEPARTMENT`;\n- SOP lifecycle: `DRAFT -> PROCESS_REVIEW -> REVISION_REQUIRED | FINAL_APPROVAL -> TTE_PENDING -> EFFECTIVE -> SUPERSEDED | REVOKED`;\n- active SOP ownership: `SOP.processId`;\n- public archive: Process-first;\n- notification, review, approval, TTE, versioning, and revocation are Process-native.\n\n## Current milestone\n\nRestore a coherent green master after schema contraction by removing stale compatibility callers from runtime, client contracts, tests, tooling, CI, and repository knowledge.\n\n## Done when\n\nOne exact PR head passes Client CI, Server CI, FTI Domain CI, Migration Smoke, Full FTI Exit, and Container Build. Active source must contain no removed organization/global-role model. Historical migration SQL is immutable and excluded from this rule.\n''')

write('.agents/ARCHITECTURE.md', '''# ARCHITECTURE\n\n## Target architecture\n\n```text\nPengguna + PlatformRole\n        |\n        +--> ProcessOwnerAuthority ----> Process ----> SOP ----> DetailSOP\n        |                                  |             |\n        +--> ProcessMember ----------------+             +--> Review / Approval / TTE / Version\n        |\n        +--> OrganizationalAuthorityAssignment\n                 |\n                 +--> DEAN (Faculty)\n                 +--> HEAD_OF_DEPARTMENT (Department)\n```\n\n### Identity and authorization\n\n`PlatformRole` is only platform administration. Workflow authorization is contextual to Process ownership/membership. Final approval and TTE authorization come only from the organizational authority resolved for the Process scope. No platform administrator bypass exists for workflow approval or signing.\n\n### SOP ownership\n\nAn active SOP belongs directly to one Process through `SOP.processId`. A Process has exactly one owner and zero or more members. Department context is organizational scope metadata, not SOP ownership.\n\n### Lifecycle\n\n`DRAFT -> PROCESS_REVIEW -> REVISION_REQUIRED | FINAL_APPROVAL -> TTE_PENDING -> EFFECTIVE -> SUPERSEDED | REVOKED`. Review, final approval, signing evidence, publication, version replacement, and revocation must transition this lifecycle atomically where required.\n\n### TTE\n\nSigning evidence stores `OrganizationalAuthority` (`DEAN` or `HEAD_OF_DEPARTMENT`) plus signer identity and certificate metadata. Public verification exposes this authority directly.\n\n### Catalogs\n\nPeraturan and Pelaksana are reusable global catalogs. Procedure and diagram engines consume them without organization ownership shadows.\n\n### Persistence history\n\nPreviously applied migration SQL remains immutable so an old database can be migrated forward deterministically. Historical identifiers inside those SQL files are migration mechanics, not application architecture.\n''')

write('.agents/CODE_PATTERNS.md', '''# CODE PATTERNS\n\n## Domain vocabulary\n\nUse these concepts in new code:\n- `PlatformRole.SUPER_ADMIN | USER`\n- `Process.ownerId`\n- `ProcessMember`\n- `OrganizationalScope.FACULTY | DEPARTMENT`\n- `OrganizationalAuthority.DEAN | HEAD_OF_DEPARTMENT`\n- `StatusSOP.DRAFT | PROCESS_REVIEW | REVISION_REQUIRED | FINAL_APPROVAL | TTE_PENDING | EFFECTIVE | SUPERSEDED | REVOKED`\n- `BagianSOP.REVIEW` for review activity.\n\n## Authorization\n\nResolve authorization from the owning Process and its relationships. Do not infer workflow authority from account profile fields or platform administration. Resolve legal approval/TTE authority using `OrganizationalAuthorityService`.\n\n## Repository boundaries\n\nRepositories should select only fields required by their domain. Keep identity/session, Process relationship, organizational authority, SOP lifecycle, TTE, catalog, and presentation concerns separate.\n\n## Testing\n\nFixtures should represent native actors: platform admin, Process Owner, Process Member, Dean, and Department Head. Test native lifecycle states directly. Prefer focused unit tests plus real-boundary migration/database checks; do not recreate retired product models in fixtures.\n\n## Migration rule\n\nNever edit an already-applied migration merely to rename historical vocabulary. New target code must not depend on historical migration structures.\n''')

write('.agents/PROJECT.md', '''# PROJECT\n\n## Product\n\nSOPFlow FTI manages the complete SOP lifecycle for Fakultas Teknologi Informasi: authoring, Process review, contextual final approval, electronic signing, publication, public verification, version replacement, and revocation.\n\n## Actors\n\n- **Platform Admin**: configures accounts, departments, owner eligibility, and organizational authority assignments.\n- **Process Owner**: owns a Process, manages its team, and reviews submitted SOP work.\n- **Process Member / Penyusun SOP**: authors SOPs within Processes they belong to.\n- **Dean**: final approval and TTE authority for Faculty-scoped Processes.\n- **Head of Department**: final approval and TTE authority for that Department's Processes.\n\n## Core journey\n\n```text\nCreate/choose Process\n -> author SOP\n -> submit for Process review\n -> revise or accept\n -> contextual final approval\n -> TTE\n -> Effective/public archive\n -> optional new version or revocation\n```\n\n## Product invariants\n\n- Active SOP ownership is direct to `Process`.\n- Platform administration is not workflow authority.\n- Review authorization is Process-contextual.\n- Final approval and TTE holder are derived from Process organizational scope.\n- Faculty Process resolves to Dean; Department Process resolves to that Department Head.\n- Signing evidence stores contextual organizational authority.\n- Peraturan and Pelaksana are reusable global catalogs.\n- Public archive and public signing verification expose current FTI semantics.\n- Historical migration SQL is immutable implementation history and is not a product contract.\n\n## Engineering boundary\n\nPreserve SOP editor/procedure/diagram behavior unless a requested user outcome requires changing it. Prefer the smallest coherent vertical change and proportional verification.\n''')

write('.agents/DECISIONS.md', '''# DECISIONS\n\n## Current architectural decisions\n\n1. **Process is the canonical SOP ownership boundary.** Active SOPs reference `Process` directly.\n2. **Authorization axes are separate.** `PlatformRole` controls platform administration; Process relationships control authoring/review; organizational authority controls final approval/TTE.\n3. **Signing authority is contextual.** Faculty -> Dean; Department -> its Head. Signing evidence stores that authority.\n4. **Lifecycle vocabulary is native.** Persist and expose only `DRAFT`, `PROCESS_REVIEW`, `REVISION_REQUIRED`, `FINAL_APPROVAL`, `TTE_PENDING`, `EFFECTIVE`, `SUPERSEDED`, and `REVOKED`.\n5. **Catalogs are global.** Peraturan and Pelaksana are reusable and are not owned by organizational scope.\n6. **Public archive is Process-first.** Search and navigation use Process/Department context.\n7. **Migration history is immutable.** Applied SQL can contain historical schema mechanics, but runtime, tests, tooling, and current docs must not depend on them.\n8. **No compatibility layer after contraction.** Removed product models are not reintroduced through adapters, fallback DTOs, fixtures, or authorization shortcuts.\n''')

write('server/prisma/DB-INVARIANTS.md', '''# Database invariants — FTI target schema\n\n## Identity\n- `Pengguna.email` and `Pengguna.nip` are unique.\n- Platform administration is represented only by `platformRole`.\n\n## Process\n- A Process has one owner.\n- Faculty Process has no `departmentId`.\n- Department Process has a valid `departmentId`.\n- Process membership is unique by `(processId, penggunaId)`.\n\n## SOP\n- Active SOP ownership is `SOP.processId`.\n- Version identity is unique by `(sopId, versi)`.\n- `DetailSOP.status` uses only the native lifecycle enum.\n- Effective/version replacement/revocation transitions must preserve a coherent version chain.\n\n## Review and approval\n- Process review evidence belongs to the same Process/SOP/detail being transitioned.\n- Final approval references the accepted Process review and resolved organizational authority.\n- Faculty approval authority is Dean. Department approval authority is that Department Head.\n\n## TTE\n- TTE documents for SOPs are bound to `detailSopId` and `processId`.\n- Signing history stores contextual `OrganizationalAuthority` and signer/certificate evidence.\n- A signed version must transition from `TTE_PENDING` to `EFFECTIVE` atomically with signing evidence.\n\n## Catalogs\n- Peraturan identity is unique by `(nomor, tahun)`.\n- Pelaksana name is globally unique.\n\n## Migration-history boundary\nPreviously applied migration SQL is immutable. Post-contraction audits validate the target schema after the full migration chain rather than treating removed structures as active invariants.\n''')

write('client/e2e/README.md', '''# SOPFlow FTI E2E\n\nThe E2E suite models only current FTI actors and journeys.\n\n## Actors\n- Platform Admin\n- Process Owner\n- Process Member / Penyusun SOP\n- Dean\n- Head of Department\n\n## Seed\nRun the server target seed before browser journeys. The seed creates Departments, Processes, owner eligibility, Process membership, organizational authority assignments, Peraturan, and Pelaksana.\n\n## Environment\nUse the target E2E identities supplied by `client/e2e/fixtures/target-users.ts` and the configured seed password. Do not add global workflow-role fixtures.\n\n## Critical journeys\n- Process-scoped SOP authoring\n- Process Owner review and revision\n- Faculty/Department contextual final approval\n- TTE and public verification\n- version integrity / supersede\n- revocation\n\nTests should assert native lifecycle values directly.\n''')

# Remove historical terminology from skill guidance without rewriting the whole skills.
for rel in ['.agents/skill/backend/SKILL.md', '.agents/skill/frontend/SKILL.md']:
    edit(rel, lambda t: t.replace('PengajuanEvaluasi', 'retired evaluation persistence').replace('OPD', 'retired organization model').replace('KEPALA_OPD', 'organizational authority').replace('PJ_EVALUATOR', 'final approval authority').replace('PJ_PENYUSUN', 'Process Owner'))

print(json.dumps({'changed': sorted(set(changed)), 'deleted': sorted(set(deleted))}, indent=2))
