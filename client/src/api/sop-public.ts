import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { SOP_WORKFLOW_REFRESH_OPTIONS } from '@/lib/api/cache-invalidation'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  PublicArsipQueryParams,
  PublicProsesBisnisPage,
  PublicSopByProsesBisnisPage,
  PublicSopDokumen,
  PublicSopPage,
} from '@/types/dto/sop-public.dto'

export const sopPublicApi = {
  listProsesBisnis: (params?: PublicArsipQueryParams) =>
    unwrapApiData<PublicProsesBisnisPage>(
      apiClient.get<ApiSuccessResponse<PublicProsesBisnisPage>>(
        `/sop/public/fti/prosesBisnis${buildQueryString(params as Record<string, unknown> | undefined)}`,
      ),
    ),

  listSopByProsesBisnis: (prosesBisnisId: string, params?: PublicArsipQueryParams) =>
    unwrapApiData<PublicSopByProsesBisnisPage>(
      apiClient.get<ApiSuccessResponse<PublicSopByProsesBisnisPage>>(
        `/sop/public/fti/prosesBisnis/${encodeURIComponent(prosesBisnisId)}/sop${buildQueryString(params as Record<string, unknown> | undefined)}`,
      ),
    ),

  listFtiSopGlobal: (params?: PublicArsipQueryParams) =>
    unwrapApiData<PublicSopPage>(
      apiClient.get<ApiSuccessResponse<PublicSopPage>>(
        `/sop/public/fti/sop${buildQueryString(params as Record<string, unknown> | undefined)}`,
      ),
    ),

  getDokumen: (detailSopId: string) =>
    unwrapApiData<PublicSopDokumen>(
      apiClient.get<ApiSuccessResponse<PublicSopDokumen>>(
        `/sop/public/dokumen/${encodeURIComponent(detailSopId)}`,
      ),
    ),
}

export function usePublicProsesBisnisList(params: PublicArsipQueryParams) {
  return useQuery({
    queryKey: queryKeys.sopPublicProsesBisnisList(params),
    queryFn: () => sopPublicApi.listProsesBisnis(params),
    ...SOP_WORKFLOW_REFRESH_OPTIONS,
  })
}

export function usePublicProsesBisnisSopList(prosesBisnisId: string, params: PublicArsipQueryParams) {
  return useQuery({
    queryKey: queryKeys.sopPublicProsesBisnisSopList(prosesBisnisId, params),
    queryFn: () => sopPublicApi.listSopByProsesBisnis(prosesBisnisId, params),
    enabled: Boolean(prosesBisnisId),
    ...SOP_WORKFLOW_REFRESH_OPTIONS,
  })
}

export function usePublicFtiSopGlobalList(params: PublicArsipQueryParams) {
  return useQuery({
    queryKey: queryKeys.sopPublicFtiSopGlobal(params),
    queryFn: () => sopPublicApi.listFtiSopGlobal(params),
    enabled: Boolean(params.search?.trim()),
    ...SOP_WORKFLOW_REFRESH_OPTIONS,
  })
}

export function usePublicSopDokumen(detailSopId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sopPublicDokumen(detailSopId ?? ''),
    queryFn: () => sopPublicApi.getDokumen(detailSopId!),
    enabled: Boolean(detailSopId),
    ...SOP_WORKFLOW_REFRESH_OPTIONS,
  })
}
