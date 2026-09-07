import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProsesBisnisApprovalDocumentDto,
  ProsesBisnisApprovalQueueRowDto,
  PersetujuanAkhirSOPDto,
} from '@/types/dto/persetujuan.dto'

export const approvalQueueKey = ['persetujuan-proses-bisnis'] as const

export const processApprovalApi = {
  list: (): Promise<ProsesBisnisApprovalQueueRowDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisApprovalQueueRowDto[]>>('/persetujuan-akhir-sop')),
  document: (detailSopId: string): Promise<ProsesBisnisApprovalDocumentDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProsesBisnisApprovalDocumentDto>>(
        `/persetujuan-akhir-sop/${detailSopId}/document`,
      ),
    ),
  approve: (detailSopId: string): Promise<PersetujuanAkhirSOPDto> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<PersetujuanAkhirSOPDto>>(`/persetujuan-akhir-sop/${detailSopId}/approve`)),
}

export function useProsesBisnisApprovalQueue() {
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
