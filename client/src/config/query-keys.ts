/** Centralized TanStack Query keys. */
export const queryKeys = {
  auth: ['auth'] as const,
  user: (userId: string) => ['auth', 'user', userId] as const,
  users: ['users'] as const,

  platformAccounts: ['platformAccounts'] as const,

  processAdmin: ['processAdmin'] as const,
  processAdminDepartments: ['processAdmin', 'departments'] as const,
  processAdminUsers: ['processAdmin', 'users'] as const,
  processAdminProcesses: ['processAdmin', 'processes'] as const,
  processOwnerAuthorities: ['processAdmin', 'ownerAuthorities'] as const,

  processOwner: ['processOwner'] as const,
  processOwnerScopes: ['processOwner', 'scopes'] as const,
  processOwnerProcesses: ['processOwner', 'processes'] as const,
  processOwnerUsers: ['processOwner', 'users'] as const,
  processOwnerAudit: (processId: string) => ['processOwner', 'audit', processId] as const,

  peraturan: ['peraturan'] as const,
  peraturanList: ['peraturan', 'list'] as const,

  sop: ['sop'] as const,
  sopRiwayatVersi: (sopId: string) => ['sop', 'riwayat-versi', sopId] as const,
  sopList: (params?: { status?: string; tanggalDari?: string; tanggalSampai?: string }) =>
    ['sop', 'list', params] as const,
  penyusunWorkbench: (detailSopId: string) => ['sop', 'penyusunWorkbench', detailSopId] as const,
  detailSop: ['detailSop'] as const,

  pelaksana: ['pelaksana'] as const,

  tte: ['tte'] as const,
  tteProfil: ['tte', 'profil'] as const,
  ttePengesahanPublic: (dokumenTteId: string, userId: string) =>
    ['tte', 'pengesahan-public', dokumenTteId, userId] as const,
  ttePdfSigningStatus: ['tte', 'pdf-signing-status'] as const,

  sopPublicProcessList: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'processes', params ?? {}] as const,
  sopPublicProcessSopList: (
    processId: string,
    params?: { page?: number; limit?: number; search?: string },
  ) => ['sop', 'public', 'fti', 'processes', processId, 'sop', params ?? {}] as const,
  sopPublicFtiSopGlobal: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'sop', params ?? {}] as const,
  sopPublicDokumen: (detailSopId: string) => ['sop', 'public', 'dokumen', detailSopId] as const,
}
