from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = ROOT / 'server' / 'prisma' / 'schema.prisma'

filename_map = [
    ('process-admin', 'administrasi-proses-bisnis'),
    ('process-context', 'konteks-proses-bisnis'),
    ('process-sop', 'sop-proses-bisnis'),
    ('process-review', 'pemeriksaan-proses-bisnis'),
    ('process-approval', 'persetujuan-akhir-sop'),
    ('process-invitations', 'undangan-anggota-proses-bisnis'),
    ('process-revocation', 'pencabutan-sop'),
    ('process-tte', 'tte-proses-bisnis'),
    ('ProcessLifecycleContext', 'StatusProsesBisnisContext'),
    ('ProcessInvitationActivation', 'AktivasiUndanganAnggotaProsesBisnis'),
    ('ProcessOwnerSelfServicePanel', 'PanelLayananMandiriPenanggungJawabProsesBisnis'),
    ('ProcessManagementPage', 'HalamanPengelolaanProsesBisnis'),
    ('ProcessApprovalPage', 'HalamanPersetujuanAkhirSOP'),
    ('ProcessWorkQueuePage', 'HalamanAntrianKerjaProsesBisnis'),
]

paths = sorted(
    [p for p in ROOT.rglob('*') if p.is_file()],
    key=lambda p: len(p.parts),
    reverse=True,
)
for path in paths:
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(('server/prisma/migrations/', '.github/workflows/', 'server/src/generated/')):
        continue
    new_name = path.name
    for old, new in filename_map:
        new_name = new_name.replace(old, new)
    if new_name == path.name:
        continue
    target = path.with_name(new_name)
    if target.exists():
        raise RuntimeError(f'rename collision: {path} -> {target}')
    path.rename(target)

delegate_map = {
    'processOwnerAuthority': 'kewenanganPenanggungJawabProsesBisnis',
    'processLifecycle': 'statusProsesBisnis',
    'processInvitation': 'undanganAnggotaProsesBisnis',
    'processAudit': 'riwayatAktivitasProsesBisnis',
    'organizationalAuthorityAssignment': 'penugasanPejabatBerwenang',
    'processFinalApproval': 'persetujuanAkhirSOP',
    'processNotification': 'notifikasiProsesBisnis',
    'processReminder': 'pengingatProsesBisnis',
    'processReview': 'pemeriksaanProsesBisnis',
    'processMember': 'anggotaProsesBisnis',
    'department': 'departemen',
    'process': 'prosesBisnis',
}
receiver = r'(?:this\.prisma|this\.db|prisma|tx|trx|transaction|db|mockPrisma)'
text_suffixes = {'.ts', '.tsx', '.js', '.cjs', '.mjs', '.md'}
for path in ROOT.rglob('*'):
    if not path.is_file() or path.suffix not in text_suffixes:
        continue
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(('server/prisma/migrations/', 'server/src/generated/', '.github/workflows/')):
        continue
    text = path.read_text(encoding='utf-8')
    original = text
    for old, new in delegate_map.items():
        text = re.sub(rf'({receiver})\.{re.escape(old)}\b', rf'\1.{new}', text)
    text = re.sub(r'^\s*peran:\s*true,?\s*$', '', text, flags=re.M)
    for old in (
        'assertSopWorkbenchCompleteForSiapDievaluasi',
        'assertSopWorkbenchCompleteForProcessReview',
        'assertSopWorkbenchCompleteForPemeriksaanProsesBisnis',
    ):
        text = text.replace(old, 'pastikanWorkbenchSopLengkapUntukPemeriksaanProsesBisnis')
    text = text.replace('./dto/create-process-sop.dto', './dto/create-sop-proses-bisnis.dto')
    text = text.replace(
        '../shared/dto/tanda-tangani-process-sop.dto',
        '../shared/dto/tanda-tangani-sop-proses-bisnis.dto',
    )
    component_replacements = {
        'ProcessLifecycleContext': 'StatusProsesBisnisContext',
        'ProcessInvitationActivation': 'AktivasiUndanganAnggotaProsesBisnis',
        'UndanganAnggotaProsesBisnisActivation': 'AktivasiUndanganAnggotaProsesBisnis',
        'ProcessOwnerSelfServicePanel': 'PanelLayananMandiriPenanggungJawabProsesBisnis',
        'ProsesBisnisOwnerSelfServicePanel': 'PanelLayananMandiriPenanggungJawabProsesBisnis',
        'ProcessManagementPage': 'HalamanPengelolaanProsesBisnis',
        'ProsesBisnisManagementPage': 'HalamanPengelolaanProsesBisnis',
        'ProcessApprovalPage': 'HalamanPersetujuanAkhirSOP',
        'ProsesBisnisApprovalPage': 'HalamanPersetujuanAkhirSOP',
        'ProcessWorkQueuePage': 'HalamanAntrianKerjaProsesBisnis',
        'ProsesBisnisWorkQueuePage': 'HalamanAntrianKerjaProsesBisnis',
    }
    for old, new in component_replacements.items():
        text = text.replace(old, new)
    text = text.replace('listProsesBisnises', 'listProsesBisnis')
    text = text.replace('listDepartemens', 'listDepartemen')
    if text != original:
        path.write_text(text, encoding='utf-8')

schema = SCHEMA.read_text(encoding='utf-8')
schema = schema.replace('anggotaProsesBisniships', 'keanggotaanProsesBisnis')
schema = schema.replace('"ProsesBisnisOwner"', '"PenanggungJawabProsesBisnis"')
physical_map_names = {
    'ProsesBisnis_scope_departemenId_idx': 'Process_scope_departmentId_idx',
    'ProsesBisnis_ownerId_idx': 'Process_ownerId_idx',
    'AnggotaProsesBisnis_penggunaId_idx': 'ProcessMember_penggunaId_idx',
    'PenugasanPejabatBerwenang_authority_departemenId_idx': 'OrganizationalAuthorityAssignment_authority_departmentId_idx',
    'PenugasanPejabatBerwenang_holderId_idx': 'OrganizationalAuthorityAssignment_holderId_idx',
    'PersetujuanAkhirSOP_prosesBisnisId_approvedAt_idx': 'ProcessFinalApproval_processId_approvedAt_idx',
    'PersetujuanAkhirSOP_approvedById_approvedAt_idx': 'ProcessFinalApproval_approvedById_approvedAt_idx',
    'PersetujuanAkhirSOP_authorityKey_idx': 'ProcessFinalApproval_authorityKey_idx',
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
    'KewenanganPenanggungJawabProsesBisnis_user_scopeKey_key': 'ProcessOwnerAuthority_user_scopeKey_key',
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
