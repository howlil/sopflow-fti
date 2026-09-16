import { useQuery } from '@tanstack/react-query'
import { processQueryKeys } from '@/config/kunci-query-proses-bisnis'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { ProsesBisnisDto } from '@/types/dto/proses-bisnis.dto'
import { STALE_TIME } from '@/utils/constants'

export const processContextApi = {
  mine: () =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<ProsesBisnisDto[]>>('/konteks-proses-bisnis/mine')),
}

export function useMyProsesBisnises() {
  return useQuery({
    queryKey: processQueryKeys.mine,
    queryFn: processContextApi.mine,
    staleTime: STALE_TIME.MEDIUM,
  })
}
