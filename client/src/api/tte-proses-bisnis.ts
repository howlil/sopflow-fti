import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { approvalQueueKey, tteQueueKey } from '@/api/persetujuan-akhir-sop'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  TandaTanganiProsesBisnisSopDto,
  TandaTanganiProsesBisnisSopMutationDto,
  TandaTanganiProsesBisnisSopResponse,
  TandaTanganiProsesBisnisSopBulkDto,
  TandaTanganiProsesBisnisSopBulkResponse,
} from '@/types/dto/tte.dto'

export const processTteApi = {
  sign: (
    detailSopId: string,
    payload: TandaTanganiProsesBisnisSopDto,
  ): Promise<TandaTanganiProsesBisnisSopResponse> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<TandaTanganiProsesBisnisSopResponse>>(
        `/process-tte/${detailSopId}/sign`,
        payload,
      ),
    ),
  signMany: (payload: TandaTanganiProsesBisnisSopBulkDto): Promise<TandaTanganiProsesBisnisSopBulkResponse> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<TandaTanganiProsesBisnisSopBulkResponse>>(
        '/process-tte/bulk-sign',
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
    invalidateKeys: [approvalQueueKey, tteQueueKey],
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

export function useBulkTandaTanganiProsesBisnisSop() {
  return useMutationWithToast({
    mutationFn: processTteApi.signMany,
    invalidateKeys: [approvalQueueKey, tteQueueKey],
    successMessage: 'Bulk TTE selesai diproses.',
    useDetailedErrors: true,
    errorMessagePrefix: 'Gagal memproses bulk TTE',
  })
}
