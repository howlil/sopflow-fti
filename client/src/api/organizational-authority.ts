import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  OrganizationalAuthorityAssignmentDto,
  OrganizationalAuthorityConfigurationDto,
} from '@/types/dto/approval.dto'

const authorityKeys = {
  mine: ['organizational-authority', 'mine'] as const,
  configuration: ['organizational-authority', 'configuration'] as const,
}

export const organizationalAuthorityApi = {
  mine: (): Promise<OrganizationalAuthorityAssignmentDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<OrganizationalAuthorityAssignmentDto[]>>('/organizational-authority/mine')),
  configuration: (): Promise<OrganizationalAuthorityConfigurationDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<OrganizationalAuthorityConfigurationDto[]>>('/organizational-authority/configuration')),
  assignDean: (penggunaId: string): Promise<OrganizationalAuthorityAssignmentDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<OrganizationalAuthorityAssignmentDto>>('/organizational-authority/dean', { penggunaId })),
  assignDepartmentHead: (departmentId: string, penggunaId: string): Promise<OrganizationalAuthorityAssignmentDto> =>
    unwrapApiData(apiClient.put<ApiSuccessResponse<OrganizationalAuthorityAssignmentDto>>(`/organizational-authority/departments/${departmentId}/head`, { penggunaId })),
}

export function useMyOrganizationalAuthorities() {
  return useQuery({ queryKey: authorityKeys.mine, queryFn: organizationalAuthorityApi.mine })
}

export function useOrganizationalAuthorityConfiguration() {
  const query = useQuery({ queryKey: authorityKeys.configuration, queryFn: organizationalAuthorityApi.configuration })
  const assignDean = useMutationWithToast({
    mutationFn: organizationalAuthorityApi.assignDean,
    invalidateKeys: [authorityKeys.configuration],
    successMessage: 'Dean aktif berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Dean',
  })
  const assignDepartmentHead = useMutationWithToast({
    mutationFn: ({ departmentId, penggunaId }: { departmentId: string; penggunaId: string }) =>
      organizationalAuthorityApi.assignDepartmentHead(departmentId, penggunaId),
    invalidateKeys: [authorityKeys.configuration],
    successMessage: 'Kepala Departemen aktif berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Kepala Departemen',
  })
  return {
    configuration: query.data ?? [],
    isLoading: query.isLoading,
    assignDean: assignDean.mutateAsync,
    assignDepartmentHead: assignDepartmentHead.mutateAsync,
    isSaving: assignDean.isPending || assignDepartmentHead.isPending,
  }
}
