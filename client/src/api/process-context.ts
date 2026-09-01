import { useQuery } from '@tanstack/react-query'
import { processQueryKeys } from '@/config/process-query-keys'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { ProcessDto } from '@/types/dto/process.dto'
import { STALE_TIME } from '@/utils/constants'

export const processContextApi = {
  mine: () =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProcessDto[]>>('/process-context/mine')),
}

export function useMyProcesses() {
  return useQuery({
    queryKey: processQueryKeys.mine,
    queryFn: processContextApi.mine,
    staleTime: STALE_TIME.MEDIUM,
  })
}
