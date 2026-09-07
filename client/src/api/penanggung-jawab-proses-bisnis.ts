import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { processQueryKeys } from '@/config/kunci-query-proses-bisnis'
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
} from '@/types/dto/proses-bisnis.dto'
import { STALE_TIME } from '@/utils/constants'

export const processOwnerApi = {
  scopes: (): Promise<KewenanganPenanggungJawabProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<KewenanganPenanggungJawabProsesBisnisDto[]>>('/penanggung-jawab-proses-bisnis/scopes')),
  prosesBisnis: (): Promise<ProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisDto[]>>('/penanggung-jawab-proses-bisnis/prosesBisnis')),
  users: (): Promise<ProsesBisnisAssignableUserDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisAssignableUserDto[]>>('/penanggung-jawab-proses-bisnis/users')),
  createProsesBisnis: (payload: CreateOwnedProsesBisnisPayload): Promise<ProsesBisnisDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProsesBisnisDto>>('/penanggung-jawab-proses-bisnis/prosesBisnis', payload)),
  renameProsesBisnis: (prosesBisnisId: string, nama: string): Promise<ProsesBisnisDto> =>
    unwrapApiData(apiClient.patch<ApiSuccessResponse<ProsesBisnisDto>>(`/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}`, { nama })),
  addMember: (prosesBisnisId: string, penggunaId: string): Promise<ProsesBisnisAssignableUserDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProsesBisnisAssignableUserDto>>(`/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}/members`, {
        penggunaId,
      }),
    ),
  hapusAnggota: (prosesBisnisId: string, penggunaId: string): Promise<void> =>
    unwrapApiVoid(apiClient.delete(`/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}/members/${penggunaId}`)),
  undangAnggota: (prosesBisnisId: string, payload: InviteAnggotaProsesBisnisPayload): Promise<AnggotaProsesBisnisOnboardingResult> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<AnggotaProsesBisnisOnboardingResult>>(
        `/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}/invitations`,
        payload,
      ),
    ),
  archiveProsesBisnis: (prosesBisnisId: string, reason: string): Promise<null> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<null>>(`/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}/archive`, { reason }),
    ),
  audit: (prosesBisnisId: string): Promise<RiwayatAktivitasProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<RiwayatAktivitasProsesBisnisDto[]>>(`/penanggung-jawab-proses-bisnis/prosesBisnis/${prosesBisnisId}/audit`)),
}

export function useProsesBisnisOwnerSelfService() {
  const scopesQuery = useQuery({
    queryKey: queryKeys.processOwnerScopes,
    queryFn: processOwnerApi.scopes,
    staleTime: STALE_TIME.MEDIUM,
  })
  const processesQuery = useQuery({
    queryKey: queryKeys.processOwnerProsesBisnises,
    queryFn: processOwnerApi.prosesBisnis,
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
  const hapusAnggota = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, penggunaId }: { prosesBisnisId: string; penggunaId: string }) =>
      processOwnerApi.hapusAnggota(prosesBisnisId, penggunaId),
    invalidateKeys: commonInvalidation,
    successMessage: 'Akses Penyusun SOP berhasil dicabut',
    errorMessagePrefix: 'Gagal mencabut akses Penyusun SOP',
  })
  const undangAnggota = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, payload }: { prosesBisnisId: string; payload: InviteAnggotaProsesBisnisPayload }) =>
      processOwnerApi.undangAnggota(prosesBisnisId, payload),
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
    prosesBisnis: processesQuery.data ?? [],
    users: usersQuery.data ?? [],
    isLoading:
      scopesQuery.isLoading ||
      processesQuery.isLoading ||
      (hasOwnerCapability && usersQuery.isLoading),
    createProsesBisnis: createProsesBisnis.mutateAsync,
    renameProsesBisnis: renameProsesBisnis.mutateAsync,
    addMember: addMember.mutateAsync,
    hapusAnggota: hapusAnggota.mutateAsync,
    undangAnggota: undangAnggota.mutateAsync,
    archiveProsesBisnis: archiveProsesBisnis.mutateAsync,
    isSaving:
      createProsesBisnis.isPending ||
      renameProsesBisnis.isPending ||
      addMember.isPending ||
      hapusAnggota.isPending ||
      undangAnggota.isPending ||
      archiveProsesBisnis.isPending,
  }
}
