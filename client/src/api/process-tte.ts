import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { approvalQueueKey } from '@/api/persetujuan-akhir-sop'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  TandaTanganiProsesBisnisSopDto,
  TandaTanganiProsesBisnisSopMutationDto,
  TandaTanganiProsesBisnisSopResponse,
} from '@/types/dto/tte.dto'

export const processTteApi = {
  sign: (
    detailSopId: string,
    payload: TandaTanganiProsesBisnisSopDto,
  ): Promise<TandaTanganiProsesBisnisSopResponse> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<TandaTanganiProsesBisnisSopResponse>>(
        `/tte-proses-bisnis/${detailSopId}/sign`,
        payload,
      ),
    ),
}

export function useTandaTanganiProsesBisnisSop(options?: {
  suppressSetupRequiredToast?: boolean
}) {
  return useMutationWithToast({
    mutationFn: ({ detailSopId, payload }: TandaTanganiProsesBisnisSopMutationDto) =>
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
