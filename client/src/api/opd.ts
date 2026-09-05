/**
 * OPD API service — selaras server OpdController (/opd).
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { STALE_TIME } from '@/utils/constants'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { OpdRingkas } from '@/types/dto/opd.dto'

export const opdApi = {
  /** Daftar OPD ringkas (peran menentukan ruang lingkup). */
  findAll: async (params?: { search?: string }): Promise<OpdRingkas[]> => {
    const s = params?.search?.trim()
    const qs = buildQueryString(s ? { search: s } : undefined)
    return unwrapApiData(apiClient.get<ApiSuccessResponse<OpdRingkas[]>>(`/opd${qs}`))
  },
}

export interface UseOpdOptions {
  /** Filter nama OPD (substring); relevan untuk PJ_EVALUATOR. */
  readonly search?: string
}

export function useOpd(options?: UseOpdOptions) {
  const searchKey = options?.search?.trim() ?? ''
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.opdList(searchKey || undefined),
    queryFn: () =>
      opdApi.findAll(searchKey ? { search: searchKey } : undefined),
    staleTime: STALE_TIME.MEDIUM,
  })
  const list = data ?? []

  return {
    list,
    isLoading,
    error,
  }
}
