import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  ProcessRevocationQueueRowDto,
  ProcessRevocationResultDto,
} from '@/types/dto/approval.dto'

export const revocationQueueKey = ['process-revocation'] as const

export const processRevocationApi = {
  list: (): Promise<ProcessRevocationQueueRowDto[]> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProcessRevocationQueueRowDto[]>>('/process-revocation'),
    ),
  revoke: (detailSopId: string): Promise<ProcessRevocationResultDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProcessRevocationResultDto>>(
        `/process-revocation/${detailSopId}/revoke`,
      ),
    ),
}

export function useProcessRevocationQueue() {
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
