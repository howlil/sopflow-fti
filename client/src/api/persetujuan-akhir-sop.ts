import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProsesBisnisApprovalDocumentDto,
  ProsesBisnisLifecycleGroupDto,
  ProsesBisnisTteQueueDto,
} from '@/types/dto/persetujuan.dto'

export const approvalQueueKey = ['persetujuan-proses-bisnis'] as const
export const tteQueueKey = ['persetujuan-proses-bisnis', 'tte-queue'] as const

export const processApprovalApi = {
  list: (): Promise<ProsesBisnisLifecycleGroupDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisLifecycleGroupDto[]>>('/persetujuan-proses-bisnis')),
  tteQueue: (): Promise<ProsesBisnisTteQueueDto> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisTteQueueDto>>('/persetujuan-proses-bisnis/tte-queue')),
  document: (detailSopId: string): Promise<ProsesBisnisApprovalDocumentDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProsesBisnisApprovalDocumentDto>>(
        `/persetujuan-proses-bisnis/${detailSopId}/document`,
      ),
    ),
}

export function useProsesBisnisLifecycle() {
  const query = useQuery({ queryKey: approvalQueueKey, queryFn: processApprovalApi.list })
  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useProsesBisnisTteQueue() {
  const query = useQuery({ queryKey: tteQueueKey, queryFn: processApprovalApi.tteQueue })
  return {
    pending: query.data?.pending ?? [],
    completed: query.data?.completed ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
