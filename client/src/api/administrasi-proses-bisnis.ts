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
  ProsesBisnisPayload,
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
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisDto[]>>('/administrasi-proses-bisnis/prosesBisnis')),

  /** Reserved for administrative repair/bootstrap; normal creation belongs to the authorized owner. */
  createProsesBisnis: (payload: ProsesBisnisPayload): Promise<ProsesBisnisDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProsesBisnisDto>>('/administrasi-proses-bisnis/prosesBisnis', payload)),

  updateProsesBisnis: (prosesBisnisId: string, payload: ProsesBisnisPayload): Promise<ProsesBisnisDto> =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<ProsesBisnisDto>>(`/administrasi-proses-bisnis/prosesBisnis/${prosesBisnisId}`, payload),
    ),

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

  const createProsesBisnis = useMutationWithToast({
    mutationFn: (payload: ProsesBisnisPayload) => processAdminApi.createProsesBisnis(payload),
    invalidateKeys: [queryKeys.processAdminProsesBisnises],
    successMessage: 'Proses Bisnis berhasil dibuat',
    errorMessagePrefix: 'Gagal membuat Proses Bisnis',
  })

  const updateProsesBisnis = useMutationWithToast({
    mutationFn: ({ prosesBisnisId, payload }: { prosesBisnisId: string; payload: ProsesBisnisPayload }) =>
      processAdminApi.updateProsesBisnis(prosesBisnisId, payload),
    invalidateKeys: [queryKeys.processAdminProsesBisnises],
    successMessage: 'Proses Bisnis berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Proses Bisnis',
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
    createProsesBisnis: createProsesBisnis.mutateAsync,
    updateProsesBisnis: updateProsesBisnis.mutateAsync,
    grantOwnerAuthority: grantOwnerAuthority.mutateAsync,
    revokeOwnerAuthority: revokeOwnerAuthority.mutateAsync,
    isSaving:
      createDepartemen.isPending ||
      createProsesBisnis.isPending ||
      updateProsesBisnis.isPending ||
      grantOwnerAuthority.isPending ||
      revokeOwnerAuthority.isPending,
  }
}
