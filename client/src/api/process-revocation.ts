import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProsesBisnisRevocationQueueRowDto,
  ProsesBisnisRevocationResultDto,
} from '@/types/dto/approval.dto'

export const revocationQueueKey = ['process-revocation'] as const

export const processRevocationApi = {
  list: (): Promise<ProsesBisnisRevocationQueueRowDto[]> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProsesBisnisRevocationQueueRowDto[]>>('/pencabutan-sop'),
    ),
  revoke: (detailSopId: string): Promise<ProsesBisnisRevocationResultDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProsesBisnisRevocationResultDto>>(
        `/pencabutan-sop/${detailSopId}/revoke`,
      ),
    ),
}

export function useProsesBisnisRevocationQueue() {
  const query = useQuery({ queryKey: revocationQueueKey, queryFn: processRevocationApi.list })
  const revoke = useMutationWithToast({
    mutationFn: processRevocationApi.revoke,
    invalidateKeys: [revocationQueueKey],
    successMessage: 'SOP berhasil dicabut dan tidak lagi berlaku',
    errorMessagePrefix: 'Gagal mencabut SOP',
  })
  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    revoke: revoke.mutateAsync,
    isRevoking: revoke.isPending,
  }
}
