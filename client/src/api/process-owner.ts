import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { processQueryKeys } from '@/config/process-query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData, unwrapApiVoid } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  CreateOwnedProcessPayload,
  InviteProcessMemberPayload,
  ProcessAuditDto,
  ProcessAssignableUserDto,
  ProcessDto,
  ProcessMemberOnboardingResult,
  ProcessOwnerAuthorityDto,
} from '@/types/dto/process.dto'
import { STALE_TIME } from '@/utils/constants'

export const processOwnerApi = {
  scopes: (): Promise<ProcessOwnerAuthorityDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessOwnerAuthorityDto[]>>('/process-owner/scopes')),
  processes: (): Promise<ProcessDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessDto[]>>('/process-owner/processes')),
  users: (): Promise<ProcessAssignableUserDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessAssignableUserDto[]>>('/process-owner/users')),
  createProcess: (payload: CreateOwnedProcessPayload): Promise<ProcessDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProcessDto>>('/process-owner/processes', payload)),
  renameProcess: (processId: string, nama: string): Promise<ProcessDto> =>
    unwrapApiData(apiClient.patch<ApiSuccessResponse<ProcessDto>>(`/process-owner/processes/${processId}`, { nama })),
  addMember: (processId: string, penggunaId: string): Promise<ProcessAssignableUserDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProcessAssignableUserDto>>(`/process-owner/processes/${processId}/members`, {
        penggunaId,
      }),
    ),
  removeMember: (processId: string, penggunaId: string): Promise<void> =>
    unwrapApiVoid(apiClient.delete(`/process-owner/processes/${processId}/members/${penggunaId}`)),
  inviteMember: (processId: string, payload: InviteProcessMemberPayload): Promise<ProcessMemberOnboardingResult> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProcessMemberOnboardingResult>>(
        `/process-owner/processes/${processId}/invitations`,
        payload,
      ),
    ),
  archiveProcess: (processId: string, reason: string): Promise<null> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<null>>(`/process-owner/processes/${processId}/archive`, { reason }),
    ),
  audit: (processId: string): Promise<ProcessAuditDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessAuditDto[]>>(`/process-owner/processes/${processId}/audit`)),
}

export function useProcessOwnerSelfService() {
  const scopesQuery = useQuery({
    queryKey: queryKeys.processOwnerScopes,
    queryFn: processOwnerApi.scopes,
    staleTime: STALE_TIME.MEDIUM,
  })
  const processesQuery = useQuery({
    queryKey: queryKeys.processOwnerProcesses,
    queryFn: processOwnerApi.processes,
    staleTime: STALE_TIME.SHORT,
  })
  const usersQuery = useQuery({
    queryKey: queryKeys.processOwnerUsers,
    queryFn: processOwnerApi.users,
    staleTime: STALE_TIME.MEDIUM,
  })

  const commonInvalidation = [queryKeys.processOwnerProcesses, processQueryKeys.mine]
  const createProcess = useMutationWithToast({
    mutationFn: processOwnerApi.createProcess,
    invalidateKeys: commonInvalidation,
    successMessage: 'Process berhasil dibuat',
    errorMessagePrefix: 'Gagal membuat Process',
  })
  const renameProcess = useMutationWithToast({
    mutationFn: ({ processId, nama }: { processId: string; nama: string }) =>
      processOwnerApi.renameProcess(processId, nama),
    invalidateKeys: commonInvalidation,
    successMessage: 'Nama Process berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui Process',
  })
  const addMember = useMutationWithToast({
    mutationFn: ({ processId, penggunaId }: { processId: string; penggunaId: string }) =>
      processOwnerApi.addMember(processId, penggunaId),
    invalidateKeys: commonInvalidation,
    successMessage: 'Penyusun SOP berhasil ditambahkan',
    errorMessagePrefix: 'Gagal menambahkan Penyusun SOP',
  })
  const removeMember = useMutationWithToast({
    mutationFn: ({ processId, penggunaId }: { processId: string; penggunaId: string }) =>
      processOwnerApi.removeMember(processId, penggunaId),
    invalidateKeys: commonInvalidation,
    successMessage: 'Akses Penyusun SOP berhasil dicabut',
    errorMessagePrefix: 'Gagal mencabut akses Penyusun SOP',
  })
  const inviteMember = useMutationWithToast({
    mutationFn: ({ processId, payload }: { processId: string; payload: InviteProcessMemberPayload }) =>
      processOwnerApi.inviteMember(processId, payload),
    invalidateKeys: commonInvalidation,
    successMessage: 'Onboarding Penyusun SOP berhasil diproses',
    errorMessagePrefix: 'Gagal membuat onboarding Penyusun SOP',
  })
  const archiveProcess = useMutationWithToast({
    mutationFn: ({ processId, reason }: { processId: string; reason: string }) =>
      processOwnerApi.archiveProcess(processId, reason),
    invalidateKeys: commonInvalidation,
    successMessage: 'Process berhasil diarsipkan',
    errorMessagePrefix: 'Gagal mengarsipkan Process',
  })

  return {
    scopes: scopesQuery.data ?? [],
    processes: processesQuery.data ?? [],
    users: usersQuery.data ?? [],
    isLoading: scopesQuery.isLoading || processesQuery.isLoading || usersQuery.isLoading,
    createProcess: createProcess.mutateAsync,
    renameProcess: renameProcess.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    archiveProcess: archiveProcess.mutateAsync,
    isSaving:
      createProcess.isPending ||
      renameProcess.isPending ||
      addMember.isPending ||
      removeMember.isPending ||
      inviteMember.isPending ||
      archiveProcess.isPending,
  }
}
