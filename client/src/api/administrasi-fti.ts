import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { AdministrasiFtiOverviewDto } from '@/types/dto/administrasi-fti.dto'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { STALE_TIME } from '@/utils/constants'

export const administrasiFtiApi = {
  overview: (): Promise<AdministrasiFtiOverviewDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<AdministrasiFtiOverviewDto>>(
        '/administrasi-proses-bisnis/overview',
      ),
    ),
}

export function useAdministrasiFtiOverview() {
  return useQuery({
    queryKey: queryKeys.administrasiFtiOverview,
    queryFn: administrasiFtiApi.overview,
    staleTime: STALE_TIME.SHORT,
  })
}
