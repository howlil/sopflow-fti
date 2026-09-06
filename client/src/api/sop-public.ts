import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { SOP_WORKFLOW_REFRESH_OPTIONS } from '@/lib/api/cache-invalidation'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  PublicArsipQueryParams,
  PublicProcessPage,
  PublicSopByProcessPage,
  PublicSopDokumen,
  PublicSopPage,
} from '@/types/dto/sop-public.dto'

export const sopPublicApi = {
  listProcess: (params?: PublicArsipQueryParams) =>
    unwrapApiData<PublicProcessPage>(
      apiClient.get<ApiSuccessResponse<PublicProcessPage>>(
        `/sop/public/fti/processes${buildQueryString(params as Record<string, unknown> | undefined)}`,
      ),
    ),

  listSopByProcess: (processId: string, params?: PublicArsipQueryParams) =>
    unwrapApiData<PublicSopByProcessPage>(
      apiClient.get<ApiSuccessResponse<PublicSopByProcessPage>>(
        `/sop/public/fti/processes/${encodeURIComponent(processId)}/sop${buildQueryString(params as Record<string, unknown> | undefined)}`,
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

export function usePublicProcessList(params: PublicArsipQueryParams) {
  return useQuery({
    queryKey: queryKeys.sopPublicProcessList(params),
    queryFn: () => sopPublicApi.listProcess(params),
    ...SOP_WORKFLOW_REFRESH_OPTIONS,
  })
}

export function usePublicProcessSopList(processId: string, params: PublicArsipQueryParams) {
  return useQuery({
    queryKey: queryKeys.sopPublicProcessSopList(processId, params),
    queryFn: () => sopPublicApi.listSopByProcess(processId, params),
    enabled: Boolean(processId),
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
