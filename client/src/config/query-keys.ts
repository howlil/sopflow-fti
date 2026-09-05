/**
 * Query keys untuk TanStack Query
 * Centralized query key management
 */

export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  user: (userId: string) => ['auth', 'user', userId] as const,
  users: ['users'] as const,
  usersList: (params?: {
    page?: number
    limit?: number
    opdId?: string
    peran?: string
    search?: string
  }) => ['users', 'list', params] as const,

  // FTI platform administration
  platformAccounts: ['platformAccounts'] as const,

  // FTI Process administration
  processAdmin: ['processAdmin'] as const,
  processAdminDepartments: ['processAdmin', 'departments'] as const,
  processAdminUsers: ['processAdmin', 'users'] as const,
  processAdminProcesses: ['processAdmin', 'processes'] as const,

  // Peraturan
  peraturan: ['peraturan'] as const,
  peraturanList: (opdId?: string) => ['peraturan', 'list', opdId] as const,

  // SOP
  sop: ['sop'] as const,
  sopRiwayatVersi: (sopId: string) => ['sop', 'riwayat-versi', sopId] as const,
  sopList: (params?: {
    opdId?: string
    status?: string
    tanggalDari?: string
    tanggalSampai?: string
  }) => ['sop', 'list', params] as const,
  /** GET `/sop/penyusun-workbench/:detailSopId` — agregat detail + langkah + log */
  penyusunWorkbench: (detailSopId: string) => ['sop', 'penyusunWorkbench', detailSopId] as const,

  /** Prefix invalidasi cache detail SOP (mis. setelah TTE / status). */
  detailSop: ['detailSop'] as const,

  // Pelaksana
  pelaksana: ['pelaksana'] as const,
  pelaksanaByOpd: (opdId: string) => ['pelaksana', 'byOpd', opdId] as const,

  // OPD
  opd: ['opd'] as const,
  /** v2: invalidasi cache setelah respons API memakai bungkus { data } konsisten */
  /** GET `/opd` — termasuk query `search` (PJ_EVALUATOR) */
  opdList: (search?: string) => ['opd', 'list', 'v2', search ?? ''] as const,
  /** Manajemen penyusun Biro (GET /api/v1/penyusun — grup per OPD) */
  penyusun: ['penyusun'] as const,
  penyusunGrup: (search?: string) => ['penyusun', 'grup', 'v1', search ?? ''] as const,
  penyusunRiwayatOpd: (penggunaId: string) =>
    ['penyusun', 'riwayatOpd', penggunaId] as const,

  // TTE
  tte: ['tte'] as const,
  tteProfil: ['tte', 'profil'] as const,
  /** GET `/tte/public/pengesahan/:dokumenTteId/:userId` — verifikasi publik (tanpa sesi). */
  ttePengesahanPublic: (dokumenTteId: string, userId: string) =>
    ['tte', 'pengesahan-public', dokumenTteId, userId] as const,
  /** GET `/tte/public/pdf-signing/status` */
  ttePdfSigningStatus: ['tte', 'pdf-signing-status'] as const,

  /** Arsip SOP publik — compatibility document endpoint */
  sopPublicSopGlobal: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'sop', params ?? {}] as const,

  /** Arsip SOP publik target-native — GET `/sop/public/fti/...` */
  sopPublicProcessList: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'processes', params ?? {}] as const,
  sopPublicProcessSopList: (
    processId: string,
    params?: { page?: number; limit?: number; search?: string },
  ) => ['sop', 'public', 'fti', 'processes', processId, 'sop', params ?? {}] as const,
  sopPublicFtiSopGlobal: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'sop', params ?? {}] as const,
  sopPublicDokumen: (detailSopId: string) =>
    ['sop', 'public', 'dokumen', detailSopId] as const,
}
