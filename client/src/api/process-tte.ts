import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { approvalQueueKey } from '@/api/process-approval'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  TandaTanganiProcessSopDto,
  TandaTanganiProcessSopMutationDto,
  TandaTanganiProcessSopResponse,
} from '@/types/dto/tte.dto'

export const processTteApi = {
  sign: (
    detailSopId: string,
    payload: TandaTanganiProcessSopDto,
  ): Promise<TandaTanganiProcessSopResponse> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<TandaTanganiProcessSopResponse>>(
        `/process-tte/${detailSopId}/sign`,
        payload,
      ),
    ),
}

export function useTandaTanganiProcessSop(options?: {
  suppressSetupRequiredToast?: boolean
}) {
  return useMutationWithToast({
    mutationFn: ({ detailSopId, payload }: TandaTanganiProcessSopMutationDto) =>
      processTteApi.sign(detailSopId, payload),
    invalidateKeys: [approvalQueueKey],
    successMessage: 'SOP berhasil ditandatangani dan berlaku.',
    useDetailedErrors: true,
    errorMessagePrefix: 'Gagal menandatangani SOP',
    shouldSuppressErrorToast: options?.suppressSetupRequiredToast
      ? (error) => {
          const message = error instanceof Error ? error.message : String(error)
          return /Kredensial TTE belum|PIN TTE belum|sertifikat/i.test(message)
        }
      : undefined,
  })
}
