import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProsesBisnisLifecycleGroupDto,
  ProsesBisnisTteDocumentDto,
  ProsesBisnisTteQueueDto,
} from '@/types/dto/persetujuan.dto'

export const prosesBisnisLifecycleKey = ['persetujuan-proses-bisnis'] as const
export const tteQueueKey = ['persetujuan-proses-bisnis', 'tte-queue'] as const

export const prosesBisnisLifecycleApi = {
  list: (): Promise<ProsesBisnisLifecycleGroupDto[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisLifecycleGroupDto[]>>('/persetujuan-proses-bisnis')),
  tteQueue: (): Promise<ProsesBisnisTteQueueDto> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisTteQueueDto>>('/persetujuan-proses-bisnis/tte-queue')),
  document: (detailSopId: string): Promise<ProsesBisnisTteDocumentDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProsesBisnisTteDocumentDto>>(
        `/persetujuan-proses-bisnis/${detailSopId}/document`,
      ),
    ),
}

export function useProsesBisnisLifecycle() {
  const query = useQuery({ queryKey: prosesBisnisLifecycleKey, queryFn: prosesBisnisLifecycleApi.list })
  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useProsesBisnisTteQueue() {
  const query = useQuery({ queryKey: tteQueueKey, queryFn: prosesBisnisLifecycleApi.tteQueue })
  return {
    pending: query.data?.pending ?? [],
    completed: query.data?.completed ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
