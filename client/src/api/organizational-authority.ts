import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  PenugasanPejabatBerwenangDto,
  PejabatBerwenangConfigurationDto,
} from '@/types/dto/approval.dto'

const authorityKeys = {
  mine: ['organizational-authority', 'mine'] as const,
  configuration: ['organizational-authority', 'configuration'] as const,
}

export const organizationalAuthorityApi = {
  mine: (): Promise<PenugasanPejabatBerwenangDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PenugasanPejabatBerwenangDto[]>>('/organizational-authority/mine')),
  configuration: (): Promise<PejabatBerwenangConfigurationDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PejabatBerwenangConfigurationDto[]>>('/organizational-authority/configuration')),
  assignDean: (penggunaId: string): Promise<PenugasanPejabatBerwenangDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<PenugasanPejabatBerwenangDto>>('/organizational-authority/dean', { penggunaId })),
  assignDepartemenHead: (departemenId: string, penggunaId: string): Promise<PenugasanPejabatBerwenangDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<PenugasanPejabatBerwenangDto>>(`/organizational-authority/departments/${departemenId}/head`, { penggunaId })),
}

export function useMyOrganizationalAuthorities() {
  return useQuery({ queryKey: authorityKeys.mine, queryFn: organizationalAuthorityApi.mine })
}

export function usePejabatBerwenangConfiguration() {
  const query = useQuery({ queryKey: authorityKeys.configuration, queryFn: organizationalAuthorityApi.configuration })
  const assignDean = useMutationWithToast({
    mutationFn: organizationalAuthorityApi.assignDean,
    invalidateKeys: [authorityKeys.configuration],
    successMessage: 'Dean aktif berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Dean',
  })
  const assignDepartemenHead = useMutationWithToast({
    mutationFn: ({ departemenId, penggunaId }: { departemenId: string; penggunaId: string }) =>
      organizationalAuthorityApi.assignDepartemenHead(departemenId, penggunaId),
    invalidateKeys: [authorityKeys.configuration],
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
