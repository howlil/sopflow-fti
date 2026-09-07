import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { processQueryKeys } from '@/config/process-query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData, unwrapApiVoid } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  CreateOwnedProsesBisnisPayload,
  InviteAnggotaProsesBisnisPayload,
  RiwayatAktivitasProsesBisnisDto,
  ProsesBisnisAssignableUserDto,
  ProsesBisnisDto,
  AnggotaProsesBisnisOnboardingResult,
  KewenanganPenanggungJawabProsesBisnisDto,
} from '@/types/dto/process.dto'
import { STALE_TIME } from '@/utils/constants'

export const processOwnerApi = {
  scopes: (): Promise<KewenanganPenanggungJawabProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<KewenanganPenanggungJawabProsesBisnisDto[]>>('/process-owner/scopes')),
  processes: (): Promise<ProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisDto[]>>('/process-owner/processes')),
  users: (): Promise<ProsesBisnisAssignableUserDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisAssignableUserDto[]>>('/process-owner/users')),
  createProsesBisnis: (payload: CreateOwnedProsesBisnisPayload): Promise<ProsesBisnisDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProsesBisnisDto>>('/process-owner/processes', payload)),
  renameProsesBisnis: (prosesBisnisId: string, nama: string): Promise<ProsesBisnisDto> =>
    unwrapApiData(apiClient.patch<ApiSuccessResponse<ProsesBisnisDto>>(`/process-owner/processes/${prosesBisnisId}`, { nama })),
  addMember: (prosesBisnisId: string, penggunaId: string): Promise<ProsesBisnisAssignableUserDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProsesBisnisAssignableUserDto>>(`/process-owner/processes/${prosesBisnisId}/members`, {
        penggunaId,
      }),
    ),
  removeMember: (prosesBisnisId: string, penggunaId: string): Promise<void> =>
    unwrapApiVoid(apiClient.delete(`/process-owner/processes/${prosesBisnisId}/members/${penggunaId}`)),
  inviteMember: (prosesBisnisId: string, payload: InviteAnggotaProsesBisnisPayload): Promise<AnggotaProsesBisnisOnboardingResult> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<AnggotaProsesBisnisOnboardingResult>>(
        `/process-owner/processes/${prosesBisnisId}/invitations`,
        payload,
      ),
    ),
  archiveProsesBisnis: (prosesBisnisId: string, reason: string): Promise<null> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<null>>(`/process-owner/processes/${prosesBisnisId}/archive`, { reason }),
    ),
  audit: (prosesBisnisId: string): Promise<RiwayatAktivitasProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<RiwayatAktivitasProsesBisnisDto[]>>(`/process-owner/processes/${prosesBisnisId}/audit`)),
}

export function useProsesBisnisOwnerSelfService() {
  const scopesQuery = useQuery({
    queryKey: queryKeys.processOwnerScopes,
    queryFn: processOwnerApi.scopes,
    staleTime: STALE_TIME.MEDIUM,
  })
  const processesQuery = useQuery({
    queryKey: queryKeys.processOwnerProsesBisnises,
    queryFn: processOwnerApi.processes,
    staleTime: STALE_TIME.SHORT,
  })
  const hasOwnerCapability =
    (scopesQuery.data?.length ?? 0) > 0 || (processesQuery.data?.length ?? 0) > 0
  const usersQuery = useQuery({
    queryKey: queryKeys.processOwnerUsers,
    queryFn: processOwnerApi.users,
    staleTime: STALE_TIME.MEDIUM,
    enabled: hasOwnerCapability,
  })

  const commonInvalidation = [queryKeys.processOwnerProsesBisnises, processQueryKeys.mine]
  const createProsesBisnis = useMutationWithToast({
    mutationFn: processOwnerApi.createProsesBisnis,
    invalidateKeys: commonInvalidation,
    successMessage: 'Proses Bisnis berhasil dibuat',
    errorMessagePrefix: 'Gagal membuat Proses Bisnis',
  })
  const renameProsesBisnis = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, nama }: { prosesBisnisId: string; nama: string }) =>
      processOwnerApi.renameProsesBisnis(prosesBisnisId, nama),
    invalidateKeys: commonInvalidation,
    successMessage: 'Nama Proses Bisnis berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Proses Bisnis',
  })
  const addMember = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, penggunaId }: { prosesBisnisId: string; penggunaId: string }) =>
      processOwnerApi.addMember(prosesBisnisId, penggunaId),
    invalidateKeys: commonInvalidation,
    successMessage: 'Penyusun SOP berhasil ditambahkan',
    errorMessagePrefix: 'Gagal menambahkan Penyusun SOP',
  })
  const removeMember = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, penggunaId }: { prosesBisnisId: string; penggunaId: string }) =>
      processOwnerApi.removeMember(prosesBisnisId, penggunaId),
    invalidateKeys: commonInvalidation,
    successMessage: 'Akses Penyusun SOP berhasil dicabut',
    errorMessagePrefix: 'Gagal mencabut akses Penyusun SOP',
  })
  const inviteMember = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, payload }: { prosesBisnisId: string; payload: InviteAnggotaProsesBisnisPayload }) =>
      processOwnerApi.inviteMember(prosesBisnisId, payload),
    invalidateKeys: commonInvalidation,
    successMessage: 'Onboarding Penyusun SOP berhasil diproses',
    errorMessagePrefix: 'Gagal membuat onboarding Penyusun SOP',
  })
  const archiveProsesBisnis = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, reason }: { prosesBisnisId: string; reason: string }) =>
      processOwnerApi.archiveProsesBisnis(prosesBisnisId, reason),
    invalidateKeys: commonInvalidation,
    successMessage: 'Proses Bisnis berhasil diarsipkan',
    errorMessagePrefix: 'Gagal mengarsipkan Proses Bisnis',
  })

  return {
    scopes: scopesQuery.data ?? [],
    processes: processesQuery.data ?? [],
    users: usersQuery.data ?? [],
    isLoading:
      scopesQuery.isLoading ||
      processesQuery.isLoading ||
      (hasOwnerCapability && usersQuery.isLoading),
    createProsesBisnis: createProsesBisnis.mutateAsync,
    renameProsesBisnis: renameProsesBisnis.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    archiveProsesBisnis: archiveProsesBisnis.mutateAsync,
    isSaving:
      createProsesBisnis.isPending ||
      renameProsesBisnis.isPending ||
      addMember.isPending ||
      removeMember.isPending ||
      inviteMember.isPending ||
      archiveProsesBisnis.isPending,
  }
}
