import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  PenugasanPejabatBerwenangDto,
  PejabatBerwenangConfigurationDto,
} from '@/types/dto/persetujuan.dto'

export const authorityQueryKeys = {
  mine: ['pejabat-berwenang', 'mine'] as const,
  configuration: ['pejabat-berwenang', 'configuration'] as const,
}

export const organizationalAuthorityApi = {
  mine: (): Promise<PenugasanPejabatBerwenangDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PenugasanPejabatBerwenangDto[]>>('/pejabat-berwenang/mine')),
  configuration: (): Promise<PejabatBerwenangConfigurationDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PejabatBerwenangConfigurationDto[]>>('/pejabat-berwenang/configuration')),
  assignDean: (penggunaId: string): Promise<PenugasanPejabatBerwenangDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<PenugasanPejabatBerwenangDto>>('/pejabat-berwenang/dean', { penggunaId })),
  assignDepartemenHead: (departemenId: string, penggunaId: string): Promise<PenugasanPejabatBerwenangDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<PenugasanPejabatBerwenangDto>>(`/pejabat-berwenang/departemen/${departemenId}/head`, { penggunaId })),
}

export function useMyOrganizationalAuthorities() {
  return useQuery({ queryKey: authorityQueryKeys.mine, queryFn: organizationalAuthorityApi.mine })
}

export function usePejabatBerwenangConfiguration() {
  const query = useQuery({ queryKey: authorityQueryKeys.configuration, queryFn: organizationalAuthorityApi.configuration })
  const assignDean = useMutationWithToast({
    mutationFn: organizationalAuthorityApi.assignDean,
    invalidateKeys: [authorityQueryKeys.configuration],
    successMessage: 'Dean aktif berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Dean',
  })
  const assignDepartemenHead = useMutationWithToast({
    mutationFn: ({ departemenId, penggunaId }: { departemenId: string; penggunaId: string }) =>
      organizationalAuthorityApi.assignDepartemenHead(departemenId, penggunaId),
    invalidateKeys: [authorityQueryKeys.configuration],
    successMessage: 'Kepala Departemen aktif berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Kepala Departemen',
  })
  return {
    configuration: query.data ?? [],
    isLoading: query.isLoading,
    assignDean: assignDean.mutateAsync,
    assignDepartemenHead: assignDepartemenHead.mutateAsync,
    isSaving: assignDean.isPending || assignDepartemenHead.isPending,
  }
}
