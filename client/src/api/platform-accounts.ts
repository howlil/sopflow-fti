import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { STALE_TIME } from '@/utils/constants'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'

export interface PlatformAccountDto {
  penggunaId: string
  nama: string
  email: string
  nip: string
  jabatan: string
  pangkat: string
  nohp: string
  platformRole: 'SUPER_ADMIN' | 'USER'
  deletedAt: string | null
}

export interface CreatePlatformAccountPayload {
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
}

export interface UpdatePlatformAccountPayload {
  nama?: string
  nip?: string
  email?: string
  jabatan?: string
  pangkat?: string
  nohp?: string
  status?: 'AKTIF' | 'NONAKTIF'
}

export const platformAccountsApi = {
  list: (): Promise<PlatformAccountDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PlatformAccountDto[]>>('/platform-accounts')),

  create: (payload: CreatePlatformAccountPayload): Promise<PlatformAccountDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<PlatformAccountDto>>('/platform-accounts', payload)),

  update: (penggunaId: string, payload: UpdatePlatformAccountPayload): Promise<PlatformAccountDto> =>
    unwrapApiData(apiClient.patch<ApiSuccessResponse<PlatformAccountDto>>(`/platform-accounts/${penggunaId}`, payload)),
}

export function usePlatformAccounts() {
  const accountsQuery = useQuery({
    queryKey: queryKeys.platformAccounts,
    queryFn: platformAccountsApi.list,
    staleTime: STALE_TIME.MEDIUM,
  })

  const createAccount = useMutationWithToast({
    mutationFn: platformAccountsApi.create,
    invalidateKeys: [queryKeys.platformAccounts, queryKeys.processAdminUsers, queryKeys.administrasiFtiOverview],
    successMessage: 'Akun FTI berhasil dibuat',
    errorMessagePrefix: 'Gagal membuat akun FTI',
  })

  const updateAccount = useMutationWithToast({
    mutationFn: ({ penggunaId, payload }: { penggunaId: string; payload: UpdatePlatformAccountPayload }) =>
      platformAccountsApi.update(penggunaId, payload),
    invalidateKeys: [queryKeys.platformAccounts, queryKeys.processAdminUsers, queryKeys.administrasiFtiOverview],
    successMessage: 'Akun FTI berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui akun FTI',
  })

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    createAccount: createAccount.mutateAsync,
    updateAccount: updateAccount.mutateAsync,
    isSaving: createAccount.isPending || updateAccount.isPending,
  }
}
