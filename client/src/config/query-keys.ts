/** Centralized TanStack Query keys. */
export const queryKeys = {
  auth: ['auth'] as const,
  user: (userId: string) => ['auth', 'user', userId] as const,
  users: ['users'] as const,

  platformAccounts: ['platformAccounts'] as const,

  processAdmin: ['processAdmin'] as const,
  processAdminDepartemens: ['processAdmin', 'departemen'] as const,
  processAdminUsers: ['processAdmin', 'users'] as const,
  processAdminProsesBisnises: ['processAdmin', 'proses-bisnis'] as const,
  processOwnerAuthorities: ['processAdmin', 'ownerAuthorities'] as const,

  penanggungJawabProsesBisnis: ['penanggungJawabProsesBisnis'] as const,
  processOwnerScopes: ['penanggungJawabProsesBisnis', 'scopes'] as const,
  processOwnerProsesBisnises: ['penanggungJawabProsesBisnis', 'proses-bisnis'] as const,
  processOwnerUsers: ['penanggungJawabProsesBisnis', 'users'] as const,
  processOwnerAudit: (prosesBisnisId: string) => ['penanggungJawabProsesBisnis', 'audit', prosesBisnisId] as const,

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

  sopPublicProsesBisnisList: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'proses-bisnis', params ?? {}] as const,
  sopPublicProsesBisnisSopList: (
    prosesBisnisId: string,
    params?: { page?: number; limit?: number; search?: string },
  ) => ['sop', 'public', 'fti', 'proses-bisnis', prosesBisnisId, 'sop', params ?? {}] as const,
  sopPublicFtiSopGlobal: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'fti', 'sop', params ?? {}] as const,
  sopPublicDokumen: (detailSopId: string) => ['sop', 'public', 'dokumen', detailSopId] as const,
}
