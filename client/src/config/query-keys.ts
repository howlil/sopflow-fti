/** Centralized TanStack Query keys. */

type EvaluasiRingkasQueryKeyParams = {
  page?: number
  limit?: number
  opdId?: string
  status?: string
  jenis?: string
  search?: string
  statusIn?: readonly string[]
}

export const queryKeys = {
  auth: ['auth'] as const,
  user: (userId: string) => ['auth', 'user', userId] as const,
  users: ['users'] as const,
  usersList: (params?: { page?: number; limit?: number; opdId?: string; peran?: string; search?: string }) =>
    ['users', 'list', params] as const,

  processAdmin: ['processAdmin'] as const,
  processAdminDepartments: ['processAdmin', 'departments'] as const,
  processAdminUsers: ['processAdmin', 'users'] as const,
  processAdminProcesses: ['processAdmin', 'processes'] as const,

  kepalaOpd: ['kepalaOpd'] as const,
  kepalaOpdList: (search?: string) => ['kepalaOpd', 'list', 'v2', search ?? ''] as const,
  kepalaOpdRiwayat: (penggunaId: string) => ['kepalaOpd', 'riwayatOpd', penggunaId] as const,

  peraturan: ['peraturan'] as const,
  peraturanList: (opdId?: string) => ['peraturan', 'list', opdId] as const,

  sop: ['sop'] as const,
  sopRiwayatVersi: (sopId: string) => ['sop', 'riwayat-versi', sopId] as const,
  sopList: (params?: { opdId?: string; status?: string; tanggalDari?: string; tanggalSampai?: string }) =>
    ['sop', 'list', params] as const,
  penyusunWorkbench: (detailSopId: string) => ['sop', 'penyusunWorkbench', detailSopId] as const,
  detailSop: ['detailSop'] as const,

  pelaksana: ['pelaksana'] as const,
  pelaksanaByOpd: (opdId: string) => ['pelaksana', 'byOpd', opdId] as const,

  opd: ['opd'] as const,
  opdList: (search?: string) => ['opd', 'list', 'v2', search ?? ''] as const,
  penyusun: ['penyusun'] as const,
  penyusunGrup: (search?: string) => ['penyusun', 'grup', 'v1', search ?? ''] as const,
  penyusunRiwayatOpd: (penggunaId: string) => ['penyusun', 'riwayatOpd', penggunaId] as const,

  evaluatorAnggota: ['evaluatorAnggota'] as const,
  evaluatorAnggotaList: (search?: string) => ['evaluatorAnggota', 'list', 'v3', search ?? ''] as const,

  evaluasi: ['evaluasi'] as const,
  evaluasiList: (params?: { opdId?: string; status?: string; jenis?: string; statusIn?: readonly string[] }) =>
    ['evaluasi', 'list', params?.opdId, params?.status, params?.jenis,
      params?.statusIn?.length ? [...params.statusIn].slice().sort().join(',') : ''] as const,
  evaluasiPengajuanShell: (id: string) => ['evaluasi', 'pengajuan', 'shell', id] as const,
  evaluasiPengajuanSopDokumen: (pengajuanId: string, detailSopId: string, logsLimit?: number) =>
    ['evaluasi', 'pengajuan', 'sopDokumen', pengajuanId, detailSopId, logsLimit ?? 100] as const,
  evaluasiPengajuanBeritaAcara: (id: string) => ['evaluasi', 'pengajuan', 'beritaAcara', id] as const,
  evaluasiGrafikTahunan: (params?: { tahun?: number; tahunDari?: number; tahunSampai?: number }) =>
    ['evaluasi', 'grafikTahunan', params ?? {}] as const,
  evaluasiWorkspaceOpdAll: ['evaluasi', 'workspaceOpd'] as const,
  evaluasiWorkspaceOpdSayaAll: ['evaluasi', 'workspaceOpdSaya'] as const,
  evaluasiWorkspaceOpdSaya: (params?: { detailSopId?: string; expand?: string; riwayatLimit?: number }) =>
    ['evaluasi', 'workspaceOpdSaya', params ?? {}] as const,
  evaluasiWorkspaceOpd: (opdId: string, params?: { detailSopId?: string; expand?: string; riwayatLimit?: number }) =>
    ['evaluasi', 'workspaceOpd', opdId, params ?? {}] as const,
  evaluasiWorkspacePengajuanAll: ['evaluasi', 'workspacePengajuan'] as const,
  evaluasiWorkspacePengajuan: (pengajuanId: string, params?: { detailSopId?: string; expand?: string; riwayatLimit?: number }) =>
    ['evaluasi', 'workspacePengajuan', pengajuanId, params ?? {}] as const,
  evaluasiRingkas: (params?: EvaluasiRingkasQueryKeyParams) => ['evaluasi', 'ringkas', params ?? {}] as const,
  evaluasiRingkasAll: ['evaluasi', 'ringkas'] as const,

  tte: ['tte'] as const,
  tteProfil: ['tte', 'profil'] as const,
  ttePengesahanPublic: (dokumenTteId: string, userId: string) =>
    ['tte', 'pengesahan-public', dokumenTteId, userId] as const,
  ttePdfSigningStatus: ['tte', 'pdf-signing-status'] as const,

  evaluasiUmpanBalik: (detailSopId: string) => ['evaluasi', 'umpan-balik', detailSopId] as const,

  sopPublicOpdList: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'opd', params ?? {}] as const,
  sopPublicSopList: (opdId: string, params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'opd', opdId, 'sop', params ?? {}] as const,
  sopPublicSopGlobal: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'sop', params ?? {}] as const,
  sopPublicDokumen: (detailSopId: string) => ['sop', 'public', 'dokumen', detailSopId] as const,
}
