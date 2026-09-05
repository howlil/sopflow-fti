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

  // Global FTI regulation catalog
  peraturan: ['peraturan'] as const,
  peraturanList: ['peraturan', 'list'] as const,

  // SOP
  sop: ['sop'] as const,
  sopRiwayatVersi: (sopId: string) => ['sop', 'riwayat-versi', sopId] as const,
  sopList: (params?: {
    status?: string
    tanggalDari?: string
    tanggalSampai?: string
  }) => ['sop', 'list', params] as const,
  penyusunWorkbench: (detailSopId: string) => ['sop', 'penyusunWorkbench', detailSopId] as const,
  detailSop: ['detailSop'] as const,

  // Global FTI actor catalog
  pelaksana: ['pelaksana'] as const,

  // Explicit legacy compatibility surfaces
  opd: ['opd'] as const,
  opdList: (search?: string) => ['opd', 'list', 'compatibility', search ?? ''] as const,
  penyusun: ['penyusun'] as const,
  penyusunGrup: (search?: string) => ['penyusun', 'grup', 'compatibility', search ?? ''] as const,
  penyusunRiwayatOpd: (penggunaId: string) =>
    ['penyusun', 'riwayatOpd', penggunaId] as const,

  // TTE
  tte: ['tte'] as const,
  tteProfil: ['tte', 'profil'] as const,
  ttePengesahanPublic: (dokumenTteId: string, userId: string) =>
    ['tte', 'pengesahan-public', dokumenTteId, userId] as const,
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
