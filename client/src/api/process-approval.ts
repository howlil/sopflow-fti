import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProcessApprovalDocumentDto,
  ProcessApprovalQueueRowDto,
  ProcessFinalApprovalDto,
} from '@/types/dto/approval.dto'

export const approvalQueueKey = ['process-approval'] as const

export const processApprovalApi = {
  list: (): Promise<ProcessApprovalQueueRowDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessApprovalQueueRowDto[]>>('/process-approval')),
  document: (detailSopId: string): Promise<ProcessApprovalDocumentDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProcessApprovalDocumentDto>>(
        `/process-approval/${detailSopId}/document`,
      ),
    ),
  approve: (detailSopId: string): Promise<ProcessFinalApprovalDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<ProcessFinalApprovalDto>>(`/process-approval/${detailSopId}/approve`)),
}

export function useProcessApprovalQueue() {
  const query = useQuery({ queryKey: approvalQueueKey, queryFn: processApprovalApi.list })
  const approve = useMutationWithToast({
    mutationFn: processApprovalApi.approve,
    invalidateKeys: [approvalQueueKey],
    successMessage: 'SOP disetujui dan menunggu TTE',
    errorMessagePrefix: 'Gagal menyetujui SOP',
  })
  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    approve: approve.mutateAsync,
    isApproving: approve.isPending,
  }
}
