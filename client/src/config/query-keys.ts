import type { EvaluasiRingkasQueryKeyParams } from '@/types/dto/evaluasi.dto'

export const queryKeys = {
  authMe: ['auth', 'me'] as const,
  pengguna: ['pengguna'] as const,
  opd: ['opd'] as const,
  opdAktif: ['opd', 'aktif'] as const,
  roles: ['roles'] as const,
  peraturan: ['peraturan'] as const,
  pelaksana: ['pelaksana'] as const,
  platformAccounts: ['platform', 'accounts'] as const,
  platformAccount: (penggunaId: string) => ['platform', 'accounts', penggunaId] as const,
  processAdminDepartments: ['process-admin', 'departments'] as const,
  processAdminProcesses: ['process-admin', 'processes'] as const,
  processAdminAssignableUsers: ['process-admin', 'assignable-users'] as const,
  organizationalAuthority: ['organizational-authority'] as const,
  processContext: ['process-context'] as const,
  processWorkQueue: ['process-work-queue'] as const,
  processApproval: ['process-approval'] as const,
  processRevocation: ['process-revocation'] as const,
  processTteProfile: ['process-tte', 'profile'] as const,
  processNotificationList: (limit: number) => ['process-notifications', 'list', limit] as const,
  processNotificationSummary: ['process-notifications', 'summary'] as const,
  sopList: (params?: Record<string, unknown>) => ['sop', 'list', params ?? {}] as const,
  sopDetail: (detailSopId: string) => ['sop', 'detail', detailSopId] as const,
  sopRiwayat: (sopId: string) => ['sop', 'riwayat', sopId] as const,
  evaluasi: ['evaluasi'] as const,
  evaluasiPengajuan: (pengajuanId: string) => ['evaluasi', 'pengajuan', pengajuanId] as const,
  evaluasiWorkspacePengajuanAll: ['evaluasi', 'workspacePengajuan'] as const,
  evaluasiWorkspacePengajuan: (
    pengajuanId: string,
    params?: { detailSopId?: string; expand?: string; riwayatLimit?: number },
  ) => ['evaluasi', 'workspacePengajuan', pengajuanId, params ?? {}] as const,
  evaluasiRingkas: (params?: EvaluasiRingkasQueryKeyParams) =>
    ['evaluasi', 'ringkas', params ?? {}] as const,
  /** Invalidate semua query GET `/evaluasi/ringkas` */
  evaluasiRingkasAll: ['evaluasi', 'ringkas'] as const,

  // TTE
  tte: ['tte'] as const,
  tteProfil: ['tte', 'profil'] as const,
  /** GET `/tte/public/pengesahan/:dokumenTteId/:userId` — verifikasi publik (tanpa sesi). */
  ttePengesahanPublic: (dokumenTteId: string, userId: string) =>
    ['tte', 'pengesahan-public', dokumenTteId, userId] as const,
  /** GET `/tte/public/pdf-signing/status` */
  ttePdfSigningStatus: ['tte', 'pdf-signing-status'] as const,

  /** GET `/evaluasi/umpan-balik/detail/:detailSopId` */
  evaluasiUmpanBalik: (detailSopId: string) =>
    ['evaluasi', 'umpan-balik', detailSopId] as const,

  /** Arsip SOP publik — compatibility GET `/sop/public/opd...` */
  sopPublicOpdList: (params?: { page?: number; limit?: number; search?: string }) =>
    ['sop', 'public', 'opd', params ?? {}] as const,
  sopPublicSopList: (
    opdId: string,
    params?: { page?: number; limit?: number; search?: string },
  ) => ['sop', 'public', 'opd', opdId, 'sop', params ?? {}] as const,
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
