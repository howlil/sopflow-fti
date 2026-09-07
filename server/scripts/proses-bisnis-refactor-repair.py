from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = ROOT / 'server' / 'prisma' / 'schema.prisma'
EXCLUDED = ('server/prisma/migrations/', 'server/src/generated/', '.github/workflows/')


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def git_mv(src: str, dst: str) -> None:
    source = ROOT / src
    target = ROOT / dst
    if not source.exists():
        return
    if target.exists():
        raise RuntimeError(f'rename collision: {src} -> {dst}')
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['git', 'mv', src, dst], cwd=ROOT, check=True)


for source, target in (
    ('server/src/modules/core/process', 'server/src/modules/core/proses-bisnis'),
    ('server/src/modules/notifications/process', 'server/src/modules/notifications/proses-bisnis'),
    ('server/src/modules/sop/process-authoring', 'server/src/modules/sop/penyusunan-proses-bisnis'),
    ('client/src/routes/admin/processes', 'client/src/routes/admin/proses-bisnis'),
    ('client/src/pages/approval', 'client/src/pages/persetujuan'),
    ('client/src/routes/approval', 'client/src/routes/persetujuan'),
):
    git_mv(source, target)


filename_replacements = (
    ('process-owner-authority', 'kewenangan-penanggung-jawab-proses-bisnis'),
    ('organizational-authority', 'pejabat-berwenang'),
    ('process-final-approval', 'persetujuan-akhir-sop'),
    ('process-owner-review', 'pemeriksaan-penanggung-jawab-proses-bisnis'),
    ('process-invitation', 'undangan-anggota-proses-bisnis'),
    ('process-notification', 'notifikasi-proses-bisnis'),
    ('process-reminder', 'pengingat-proses-bisnis'),
    ('process-bound-sop', 'sop-terikat-proses-bisnis'),
    ('process-version', 'versi-sop-proses-bisnis'),
    ('process-error-handlers', 'penangan-kesalahan-proses-bisnis'),
    ('process-query-keys', 'kunci-query-proses-bisnis'),
    ('process-owner', 'penanggung-jawab-proses-bisnis'),
    ('process-member', 'anggota-proses-bisnis'),
    ('process-review', 'pemeriksaan-proses-bisnis'),
    ('process-approval', 'persetujuan-proses-bisnis'),
    ('process-lifecycle', 'siklus-proses-bisnis'),
    ('process-audit', 'riwayat-aktivitas-proses-bisnis'),
    ('process.controller', 'proses-bisnis.controller'),
    ('process.module', 'proses-bisnis.module'),
    ('process.repository', 'proses-bisnis.repository'),
    ('process.service', 'proses-bisnis.service'),
    ('sop-proses-bisnis-lifecycle', 'sop-proses-bisnis-siklus'),
    ('sop-proses-bisnis-revocation', 'pencabutan-sop-proses-bisnis'),
    ('process.dto', 'proses-bisnis.dto'),
    ('ProcessLifecycleContext', 'StatusProsesBisnisContext'),
    ('ProcessInvitationActivation', 'AktivasiUndanganAnggotaProsesBisnis'),
    ('ProcessOwnerSelfServicePanel', 'PanelLayananMandiriPenanggungJawabProsesBisnis'),
    ('ProcessManagementPage', 'HalamanPengelolaanProsesBisnis'),
    ('ProcessApprovalPage', 'HalamanPersetujuanAkhirSOP'),
    ('ProcessWorkQueuePage', 'HalamanAntrianKerjaProsesBisnis'),
)

tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
paths = sorted((ROOT / item for item in tracked if item), key=lambda p: len(p.parts), reverse=True)
for path in paths:
    if not path.exists() or rel(path).startswith(EXCLUDED):
        continue
    new_name = path.name
    for old, new in filename_replacements:
        new_name = new_name.replace(old, new)
    if new_name == path.name:
        continue
    target = path.with_name(new_name)
    if target.exists():
        raise RuntimeError(f'rename collision: {path} -> {target}')
    subprocess.run(['git', 'mv', rel(path), rel(target)], cwd=ROOT, check=True)


literal_replacements = (
    ('server/src/modules/core/process', 'server/src/modules/core/proses-bisnis'),
    ('modules/core/process', 'modules/core/proses-bisnis'),
    ('core/process', 'core/proses-bisnis'),
    ('notifications/process', 'notifications/proses-bisnis'),
    ('process-authoring', 'penyusunan-proses-bisnis'),
    ('routes/admin/processes', 'routes/admin/proses-bisnis'),
    ('pages/approval', 'pages/persetujuan'),
    ('routes/approval', 'routes/persetujuan'),
    ('process-owner-authority', 'kewenangan-penanggung-jawab-proses-bisnis'),
    ('organizational-authority', 'pejabat-berwenang'),
    ('process-final-approval', 'persetujuan-akhir-sop'),
    ('process-owner-review', 'pemeriksaan-penanggung-jawab-proses-bisnis'),
    ('process-invitation', 'undangan-anggota-proses-bisnis'),
    ('process-notification', 'notifikasi-proses-bisnis'),
    ('process-reminder', 'pengingat-proses-bisnis'),
    ('process-bound-sop', 'sop-terikat-proses-bisnis'),
    ('process-version', 'versi-sop-proses-bisnis'),
    ('process-error-handlers', 'penangan-kesalahan-proses-bisnis'),
    ('process-query-keys', 'kunci-query-proses-bisnis'),
    ('process-owner', 'penanggung-jawab-proses-bisnis'),
    ('process-review', 'pemeriksaan-proses-bisnis'),
    ('process-approval', 'persetujuan-proses-bisnis'),
    ('process-lifecycle', 'siklus-proses-bisnis'),
    ('process-audit', 'riwayat-aktivitas-proses-bisnis'),
    ('process.controller', 'proses-bisnis.controller'),
    ('process.module', 'proses-bisnis.module'),
    ('process.repository', 'proses-bisnis.repository'),
    ('process.service', 'proses-bisnis.service'),
    ('sop-proses-bisnis-lifecycle', 'sop-proses-bisnis-siklus'),
    ('sop-proses-bisnis-revocation', 'pencabutan-sop-proses-bisnis'),
    ('types/dto/process.dto', 'types/dto/proses-bisnis.dto'),
    ('/admin/processes', '/admin/proses-bisnis'),
    ('/approval', '/persetujuan'),
    ('process-admin', 'administrasi-proses-bisnis'),
    ('process-context', 'konteks-proses-bisnis'),
    ("'departments'", "'departemen'"),
    ('"departments"', '"departemen"'),
    ("'processes'", "'proses-bisnis'"),
    ('"processes"', '"proses-bisnis"'),
    ('penggunaId_scopeKey', 'penggunaId_kunciLingkup'),
    ('Proses Bisnis Team', 'Tim Proses Bisnis'),
    ('Process Owner', 'Penanggung Jawab Proses Bisnis'),
    ('Process Member', 'Anggota Proses Bisnis'),
    ('Process Review', 'Pemeriksaan Proses Bisnis'),
    ('Process Lifecycle', 'Siklus Proses Bisnis'),
    ('Process Invitation', 'Undangan Proses Bisnis'),
    ('Organizational Authority', 'Pejabat Berwenang'),
    ('organizational authority', 'pejabat berwenang'),
    ('owner eligibility', 'kelayakan penanggung jawab Proses Bisnis'),
    ('owner dan members', 'penanggung jawab dan anggota'),
    ('owner and members', 'penanggung jawab dan anggota'),
    ('Proses Bisnisship', 'kepemilikan Proses Bisnis'),
    ('ProsesBisnis Review', 'Pemeriksaan Proses Bisnis'),
    ('lifecycle', 'siklus'),
)

identifier_replacements = (
    ('ProcessOwnerAuthority', 'KewenanganPenanggungJawabProsesBisnis'),
    ('ProcessOwner', 'PenanggungJawabProsesBisnis'),
    ('ProcessMember', 'AnggotaProsesBisnis'),
    ('ProcessInvitation', 'UndanganAnggotaProsesBisnis'),
    ('ProcessReview', 'PemeriksaanProsesBisnis'),
    ('ProcessFinalApproval', 'PersetujuanAkhirSOP'),
    ('ProcessLifecycle', 'SiklusProsesBisnis'),
    ('ProcessAudit', 'RiwayatAktivitasProsesBisnis'),
    ('ProcessNotification', 'NotifikasiProsesBisnis'),
    ('ProcessReminder', 'PengingatProsesBisnis'),
    ('OrganizationalAuthorityAssignment', 'PenugasanPejabatBerwenang'),
    ('OrganizationalAuthority', 'PejabatBerwenang'),
    ('ProsesBisnisOwnerService', 'PenanggungJawabProsesBisnisService'),
    ('ProsesBisnisOwnerController', 'PenanggungJawabProsesBisnisController'),
    ('ProcessOwnerSelfServicePanel', 'PanelLayananMandiriPenanggungJawabProsesBisnis'),
    ('ProsesBisnisOwnerSelfServicePanel', 'PanelLayananMandiriPenanggungJawabProsesBisnis'),
    ('ProcessLifecycleContext', 'StatusProsesBisnisContext'),
    ('ProcessInvitationActivation', 'AktivasiUndanganAnggotaProsesBisnis'),
    ('UndanganAnggotaProsesBisnisActivation', 'AktivasiUndanganAnggotaProsesBisnis'),
    ('ProcessManagementPage', 'HalamanPengelolaanProsesBisnis'),
    ('ProsesBisnisManagementPage', 'HalamanPengelolaanProsesBisnis'),
    ('ProcessApprovalPage', 'HalamanPersetujuanAkhirSOP'),
    ('ProsesBisnisApprovalPage', 'HalamanPersetujuanAkhirSOP'),
    ('ProcessWorkQueuePage', 'HalamanAntrianKerjaProsesBisnis'),
    ('ProsesBisnisWorkQueuePage', 'HalamanAntrianKerjaProsesBisnis'),
    ('processOwnerAuthority', 'kewenanganPenanggungJawabProsesBisnis'),
    ('processOwner', 'penanggungJawabProsesBisnis'),
    ('processMember', 'anggotaProsesBisnis'),
    ('processInvitation', 'undanganAnggotaProsesBisnis'),
    ('processReview', 'pemeriksaanProsesBisnis'),
    ('processFinalApproval', 'persetujuanAkhirSOP'),
    ('processLifecycle', 'siklusProsesBisnis'),
    ('processAudit', 'riwayatAktivitasProsesBisnis'),
    ('processNotification', 'notifikasiProsesBisnis'),
    ('processReminder', 'pengingatProsesBisnis'),
    ('organizationalAuthorityAssignment', 'penugasanPejabatBerwenang'),
    ('organizationalAuthority', 'pejabatBerwenang'),
    ('processService', 'prosesBisnisService'),
    ('processRepository', 'repositoriProsesBisnis'),
    ('processContextService', 'konteksProsesBisnisService'),
    ('processInclude', 'prosesBisnisInclude'),
    ('processById', 'prosesBisnisById'),
    ('processBySop', 'prosesBisnisBySop'),
    ('processId', 'prosesBisnisId'),
    ('processIds', 'prosesBisnisIds'),
    ('processName', 'namaProsesBisnis'),
    ('processNama', 'namaProsesBisnis'),
    ('processes', 'prosesBisnis'),
    ('departments', 'departemen'),
    ('ownerId', 'penanggungJawabId'),
    ('ownerName', 'namaPenanggungJawab'),
    ('ownerEmail', 'emailPenanggungJawab'),
    ('memberIds', 'anggotaIds'),
    ('memberId', 'anggotaId'),
    ('scopeKey', 'kunciLingkup'),
    ('scopeLabel', 'labelLingkup'),
    ('authorityKey', 'kunciPejabatBerwenang'),
    ('listOwnedProsesBisnises', 'listOwnedProsesBisnis'),
    ('myProsesBisnises', 'prosesBisnisSaya'),
    ('withLifecycle', 'denganSiklus'),
    ('listScopes', 'listLingkup'),
    ('assertHasOwnerCapability', 'pastikanPunyaKewenanganPenanggungJawab'),
    ('assertUniqueIdentity', 'pastikanIdentitasUnik'),
    ('requireOwnedProsesBisnis', 'wajibProsesBisnisMilikSaya'),
    ('addExistingMember', 'tambahAnggotaTerdaftar'),
    ('removeMember', 'hapusAnggota'),
    ('inviteMember', 'undangAnggota'),
    ('previewInvitation', 'pratinjauUndangan'),
    ('acceptInvitation', 'terimaUndangan'),
    ('findUsableInvitation', 'cariUndanganAktif'),
    ('listAudit', 'listRiwayatAktivitas'),
)

suffixes = {'.ts', '.tsx', '.js', '.cjs', '.mjs', '.md', '.json', '.yml', '.yaml'}
domain_markers = (
    'ProsesBisnis',
    'prosesBisnis',
    'Departemen',
    'departemenId',
    'LingkupOrganisasi',
    'penanggungJawab',
    'anggotaProsesBisnis',
    'pemeriksaanProsesBisnis',
)

for path in ROOT.rglob('*'):
    if not path.is_file() or path.suffix not in suffixes:
        continue
    relative = rel(path)
    if relative.startswith(EXCLUDED):
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    original = text
    for old, new in literal_replacements:
        text = text.replace(old, new)
    for old, new in identifier_replacements:
        text = re.sub(rf'\b{re.escape(old)}\b', new, text)

    domain_file = any(marker in text for marker in domain_markers) or any(
        marker in relative
        for marker in (
            '/proses-bisnis/',
            'proses-bisnis.',
            'administrasi-proses-bisnis',
            'penyusunan-proses-bisnis',
            '/persetujuan/',
        )
    )
    if domain_file:
        text = re.sub(r'\bProcess\b', 'ProsesBisnis', text)
        text = re.sub(r'\bprocess\b(?!\.env\b)', 'prosesBisnis', text)
        text = re.sub(r'\bscope\b', 'lingkup', text)
        text = re.sub(r'\bScope\b', 'Lingkup', text)
        text = re.sub(r'\.owner\b', '.penanggungJawab', text)
        text = re.sub(r'\bowner\s*:', 'penanggungJawab:', text)
        text = re.sub(r'\.members\b', '.anggota', text)
        text = re.sub(r'\bmembers\s*:', 'anggota:', text)
        text = re.sub(r'\.department\b', '.departemen', text)
        text = re.sub(r'\bdepartment\s*:', 'departemen:', text)
        text = re.sub(r'\.process\b', '.prosesBisnis', text)
        text = re.sub(r'\bprocess\s*:', 'prosesBisnis:', text)
        text = re.sub(r'\.sops\b', '.daftarSop', text)
        text = re.sub(r'\bsops\s*:', 'daftarSop:', text)
        text = re.sub(r'\bmember\b', 'anggota', text)
        text = re.sub(r'\bmembership\b', 'keanggotaan', text)
        text = re.sub(r'\binvitation\b', 'undangan', text)
    if text != original:
        path.write_text(text, encoding='utf-8')


schema = SCHEMA.read_text(encoding='utf-8')
quoted = re.compile(r'("(?:\\.|[^"\\])*")')
schema_replacements = (
    ('scopeKey', 'kunciLingkup'),
    ('scope', 'lingkup'),
    ('ownerId', 'penanggungJawabId'),
    ('authorityKey', 'kunciPejabatBerwenang'),
    ('processes', 'prosesBisnis'),
    ('department', 'departemen'),
    ('owner', 'penanggungJawab'),
    ('members', 'anggota'),
    ('sops', 'daftarSop'),
    ('process', 'prosesBisnis'),
)
lines = []
for line in schema.splitlines():
    parts = quoted.split(line)
    for index in range(0, len(parts), 2):
        segment = parts[index]
        for old, new in schema_replacements:
            segment = re.sub(rf'\b{re.escape(old)}\b', new, segment)
        parts[index] = segment
    line = ''.join(parts)
    if re.match(r'^\s*lingkup\s+LingkupOrganisasi\b', line) and '@map(' not in line:
        line += ' @map("scope")'
    if re.match(r'^\s*penanggungJawabId\s+String\b', line) and '@map(' not in line:
        line += ' @map("ownerId")'
    if re.match(r'^\s*kunciLingkup\s+String\b', line) and '@map(' not in line:
        line += ' @map("scopeKey")'
    if re.match(r'^\s*kunciPejabatBerwenang\s+String\b', line) and '@map(' not in line:
        line += ' @map("authorityKey")'
    lines.append(line)
SCHEMA.write_text('\n'.join(lines) + '\n', encoding='utf-8')

schema = SCHEMA.read_text(encoding='utf-8')
physical_map_names = {
    'ProsesBisnis_lingkup_departemenId_idx': 'Process_scope_departmentId_idx',
    'ProsesBisnis_penanggungJawabId_idx': 'Process_ownerId_idx',
    'AnggotaProsesBisnis_penggunaId_idx': 'ProcessMember_penggunaId_idx',
    'PenugasanPejabatBerwenang_authority_departemenId_idx': 'OrganizationalAuthorityAssignment_authority_departmentId_idx',
    'PenugasanPejabatBerwenang_holderId_idx': 'OrganizationalAuthorityAssignment_holderId_idx',
    'PersetujuanAkhirSOP_prosesBisnisId_approvedAt_idx': 'ProcessFinalApproval_processId_approvedAt_idx',
    'PersetujuanAkhirSOP_approvedById_approvedAt_idx': 'ProcessFinalApproval_approvedById_approvedAt_idx',
    'PersetujuanAkhirSOP_kunciPejabatBerwenang_idx': 'ProcessFinalApproval_authorityKey_idx',
    'PersetujuanAkhirSOP_pemeriksaanProsesBisnisId_idx': 'ProcessFinalApproval_processReviewId_idx',
    'PemeriksaanProsesBisnis_detail_created_idx': 'ProcessReview_detail_created_idx',
    'PemeriksaanProsesBisnis_process_created_idx': 'ProcessReview_process_created_idx',
    'PemeriksaanProsesBisnis_reviewer_created_idx': 'ProcessReview_reviewer_created_idx',
    'NotifikasiProsesBisnis_pengguna_read_created_idx': 'ProcessNotification_pengguna_read_created_idx',
    'NotifikasiProsesBisnis_detail_created_idx': 'ProcessNotification_detail_created_idx',
    'NotifikasiProsesBisnis_process_created_idx': 'ProcessNotification_process_created_idx',
    'PengingatProsesBisnis_detail_recipient_kind_key': 'ProcessReminder_detail_recipient_kind_key',
    'PengingatProsesBisnis_due_lock_idx': 'ProcessReminder_due_lock_idx',
    'PengingatProsesBisnis_process_created_idx': 'ProcessReminder_process_created_idx',
    'PengingatProsesBisnis_recipient_created_idx': 'ProcessReminder_recipient_created_idx',
    'KewenanganPenanggungJawabProsesBisnis_user_kunciLingkup_key': 'ProcessOwnerAuthority_user_scopeKey_key',
    'KewenanganPenanggungJawabProsesBisnis_scope_active_idx': 'ProcessOwnerAuthority_scope_active_idx',
    'KewenanganPenanggungJawabProsesBisnis_granter_created_idx': 'ProcessOwnerAuthority_granter_created_idx',
    'StatusProsesBisnis_status_updated_idx': 'ProcessLifecycle_status_updated_idx',
    'UndanganAnggotaProsesBisnis_process_status_idx': 'ProcessInvitation_process_status_idx',
    'UndanganAnggotaProsesBisnis_email_status_idx': 'ProcessInvitation_email_status_idx',
    'UndanganAnggotaProsesBisnis_inviter_created_idx': 'ProcessInvitation_inviter_created_idx',
    'RiwayatAktivitasProsesBisnis_process_created_idx': 'ProcessAudit_process_created_idx',
    'RiwayatAktivitasProsesBisnis_actor_created_idx': 'ProcessAudit_actor_created_idx',
    'RiwayatAktivitasProsesBisnis_target_created_idx': 'ProcessAudit_target_created_idx',
}
for current, physical in physical_map_names.items():
    schema = schema.replace(f'map: "{current}"', f'map: "{physical}"')
SCHEMA.write_text(schema, encoding='utf-8')

audit = ROOT / 'server' / 'prisma' / 'post-contraction-db-audit.ts'
text = audit.read_text(encoding='utf-8')
text = text.replace("current.replaceAll(\"\\\\'\", \"'\")", "current.split(\"\\\\'\").join(\"'\")")
text = text.replace(
    'new Set(entry.values)',
    'new Set(entry.values.map((value) => value.dbName ?? value.name))',
)
audit.write_text(text, encoding='utf-8')

subprocess.run(['git', 'status', '--short'], cwd=ROOT, check=True)
