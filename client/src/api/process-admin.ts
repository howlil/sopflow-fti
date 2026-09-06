import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData, unwrapApiVoid } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { STALE_TIME } from '@/utils/constants'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  DepartmentDto,
  GrantProcessOwnerAuthorityPayload,
  ProcessAssignableUserDto,
  ProcessDto,
  ProcessOwnerAuthorityDto,
  ProcessPayload,
} from '@/types/dto/process.dto'

export const processAdminApi = {
  listDepartments: (): Promise<DepartmentDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<DepartmentDto[]>>('/process-admin/departments')),

  createDepartment: (nama: string): Promise<DepartmentDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<DepartmentDto>>('/process-admin/departments', { nama })),

  updateDepartment: (departmentId: string, nama: string): Promise<DepartmentDto> =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<DepartmentDto>>(`/process-admin/departments/${departmentId}`, { nama }),
    ),

  listUsers: (): Promise<ProcessAssignableUserDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessAssignableUserDto[]>>('/process-admin/users')),

  listProcesses: (): Promise<ProcessDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessDto[]>>('/process-admin/processes')),

  /** Reserved for administrative repair/bootstrap; normal creation belongs to the authorized owner. */
  createProcess: (payload: ProcessPayload): Promise<ProcessDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProcessDto>>('/process-admin/processes', payload)),

  updateProcess: (processId: string, payload: ProcessPayload): Promise<ProcessDto> =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<ProcessDto>>(`/process-admin/processes/${processId}`, payload),
    ),

  listOwnerAuthorities: (): Promise<ProcessOwnerAuthorityDto[]> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProcessOwnerAuthorityDto[]>>('/process-admin/owner-authorities'),
    ),

  grantOwnerAuthority: (payload: GrantProcessOwnerAuthorityPayload): Promise<ProcessOwnerAuthorityDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProcessOwnerAuthorityDto>>('/process-admin/owner-authorities', payload),
    ),

  revokeOwnerAuthority: (id: string): Promise<void> =>
    unwrapApiVoid(apiClient.delete(`/process-admin/owner-authorities/${id}`)),
}

export function useProcessAdministration() {
  const departmentsQuery = useQuery({
    queryKey: queryKeys.processAdminDepartments,
    queryFn: processAdminApi.listDepartments,
    staleTime: STALE_TIME.MEDIUM,
  })
  const usersQuery = useQuery({
    queryKey: queryKeys.processAdminUsers,
    queryFn: processAdminApi.listUsers,
    staleTime: STALE_TIME.MEDIUM,
  })
  const processesQuery = useQuery({
    queryKey: queryKeys.processAdminProcesses,
    queryFn: processAdminApi.listProcesses,
    staleTime: STALE_TIME.MEDIUM,
  })
  const ownerAuthoritiesQuery = useQuery({
    queryKey: queryKeys.processOwnerAuthorities,
    queryFn: processAdminApi.listOwnerAuthorities,
    staleTime: STALE_TIME.MEDIUM,
  })

  const createDepartment = useMutationWithToast({
    mutationFn: (nama: string) => processAdminApi.createDepartment(nama),
    invalidateKeys: [queryKeys.processAdminDepartments],
    successMessage: 'Departemen berhasil ditambahkan',
    errorMessagePrefix: 'Gagal menambahkan departemen',
  })

  const createProcess = useMutationWithToast({
    mutationFn: (payload: ProcessPayload) => processAdminApi.createProcess(payload),
    invalidateKeys: [queryKeys.processAdminProcesses],
    successMessage: 'Process berhasil dibuat',
    errorMessagePrefix: 'Gagal membuat Process',
  })

  const updateProcess = useMutationWithToast({
    mutationFn: ({ processId, payload }: { processId: string; payload: ProcessPayload }) =>
      processAdminApi.updateProcess(processId, payload),
    invalidateKeys: [queryKeys.processAdminProcesses],
    successMessage: 'Process berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Process',
  })

  const grantOwnerAuthority = useMutationWithToast({
    mutationFn: processAdminApi.grantOwnerAuthority,
    invalidateKeys: [queryKeys.processOwnerAuthorities],
    successMessage: 'Kewenangan Process Owner berhasil diberikan',
    errorMessagePrefix: 'Gagal memberikan kewenangan Process Owner',
  })

  const revokeOwnerAuthority = useMutationWithToast({
    mutationFn: processAdminApi.revokeOwnerAuthority,
    invalidateKeys: [queryKeys.processOwnerAuthorities],
    successMessage: 'Kewenangan Process Owner berhasil dicabut',
    errorMessagePrefix: 'Gagal mencabut kewenangan Process Owner',
  })

  return {
    departments: departmentsQuery.data ?? [],
    users: usersQuery.data ?? [],
    processes: processesQuery.data ?? [],
    ownerAuthorities: ownerAuthoritiesQuery.data ?? [],
    isLoading:
      departmentsQuery.isLoading ||
      usersQuery.isLoading ||
      processesQuery.isLoading ||
      ownerAuthoritiesQuery.isLoading,
    createDepartment: createDepartment.mutateAsync,
    createProcess: createProcess.mutateAsync,
    updateProcess: updateProcess.mutateAsync,
    grantOwnerAuthority: grantOwnerAuthority.mutateAsync,
    revokeOwnerAuthority: revokeOwnerAuthority.mutateAsync,
    isSaving:
      createDepartment.isPending ||
      createProcess.isPending ||
      updateProcess.isPending ||
      grantOwnerAuthority.isPending ||
      revokeOwnerAuthority.isPending,
  }
}
