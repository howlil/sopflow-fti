import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData, unwrapApiVoid } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { STALE_TIME } from '@/utils/constants'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  DepartemenDto,
  GrantKewenanganPenanggungJawabProsesBisnisPayload,
  ProsesBisnisAssignableUserDto,
  ProsesBisnisDto,
  KewenanganPenanggungJawabProsesBisnisDto,
} from '@/types/dto/proses-bisnis.dto'

export const processAdminApi = {
  listDepartemen: (): Promise<DepartemenDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<DepartemenDto[]>>('/administrasi-proses-bisnis/departemen')),

  createDepartemen: (nama: string): Promise<DepartemenDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<DepartemenDto>>('/administrasi-proses-bisnis/departemen', { nama })),

  updateDepartemen: (departemenId: string, nama: string): Promise<DepartemenDto> =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<DepartemenDto>>(`/administrasi-proses-bisnis/departemen/${departemenId}`, { nama }),
    ),

  listUsers: (): Promise<ProsesBisnisAssignableUserDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisAssignableUserDto[]>>('/administrasi-proses-bisnis/users')),

  listProsesBisnis: (): Promise<ProsesBisnisDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisDto[]>>('/administrasi-proses-bisnis/proses-bisnis')),

  listOwnerAuthorities: (): Promise<KewenanganPenanggungJawabProsesBisnisDto[]> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<KewenanganPenanggungJawabProsesBisnisDto[]>>('/administrasi-proses-bisnis/owner-authorities'),
    ),

  grantOwnerAuthority: (payload: GrantKewenanganPenanggungJawabProsesBisnisPayload): Promise<KewenanganPenanggungJawabProsesBisnisDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<KewenanganPenanggungJawabProsesBisnisDto>>('/administrasi-proses-bisnis/owner-authorities', payload),
    ),

  revokeOwnerAuthority: (id: string): Promise<void> =>
    unwrapApiVoid(apiClient.delete(`/administrasi-proses-bisnis/owner-authorities/${id}`)),
}

export function useProsesBisnisAdministration() {
  const departmentsQuery = useQuery({
    queryKey: queryKeys.processAdminDepartemens,
    queryFn: processAdminApi.listDepartemen,
    staleTime: STALE_TIME.MEDIUM,
  })
  const usersQuery = useQuery({
    queryKey: queryKeys.processAdminUsers,
    queryFn: processAdminApi.listUsers,
    staleTime: STALE_TIME.MEDIUM,
  })
  const processesQuery = useQuery({
    queryKey: queryKeys.processAdminProsesBisnises,
    queryFn: processAdminApi.listProsesBisnis,
    staleTime: STALE_TIME.MEDIUM,
  })
  const ownerAuthoritiesQuery = useQuery({
    queryKey: queryKeys.processOwnerAuthorities,
    queryFn: processAdminApi.listOwnerAuthorities,
    staleTime: STALE_TIME.MEDIUM,
  })

  const createDepartemen = useMutationWithToast({
    mutationFn: (nama: string) => processAdminApi.createDepartemen(nama),
    invalidateKeys: [queryKeys.processAdminDepartemens],
    successMessage: 'Departemen berhasil ditambahkan',
    errorMessagePrefix: 'Gagal menambahkan departemen',
  })

  const updateDepartemen = useMutationWithToast({
    mutationFn: ({ departemenId, nama }: { departemenId: string; nama: string }) =>
      processAdminApi.updateDepartemen(departemenId, nama),
    invalidateKeys: [queryKeys.processAdminDepartemens],
    successMessage: 'Departemen berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui departemen',
  })

  const grantOwnerAuthority = useMutationWithToast({
    mutationFn: processAdminApi.grantOwnerAuthority,
    invalidateKeys: [queryKeys.processOwnerAuthorities],
    successMessage: 'Kewenangan Penanggung Jawab Proses Bisnis berhasil diberikan',
    errorMessagePrefix: 'Gagal memberikan kewenangan Penanggung Jawab Proses Bisnis',
  })

  const revokeOwnerAuthority = useMutationWithToast({
    mutationFn: processAdminApi.revokeOwnerAuthority,
    invalidateKeys: [queryKeys.processOwnerAuthorities],
    successMessage: 'Kewenangan Penanggung Jawab Proses Bisnis berhasil dicabut',
    errorMessagePrefix: 'Gagal mencabut kewenangan Penanggung Jawab Proses Bisnis',
  })

  return {
    departemen: departmentsQuery.data ?? [],
    users: usersQuery.data ?? [],
    prosesBisnis: processesQuery.data ?? [],
    ownerAuthorities: ownerAuthoritiesQuery.data ?? [],
    isLoading:
      departmentsQuery.isLoading ||
      usersQuery.isLoading ||
      processesQuery.isLoading ||
      ownerAuthoritiesQuery.isLoading,
    createDepartemen: createDepartemen.mutateAsync,
    updateDepartemen: updateDepartemen.mutateAsync,
    grantOwnerAuthority: grantOwnerAuthority.mutateAsync,
    revokeOwnerAuthority: revokeOwnerAuthority.mutateAsync,
    isSaving:
      createDepartemen.isPending ||
      updateDepartemen.isPending ||
      grantOwnerAuthority.isPending ||
      revokeOwnerAuthority.isPending,
  }
}
