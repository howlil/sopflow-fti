import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { PenyusunWorkbenchData } from '@/types/dto/sop.dto'
import type { PaketPemeriksaanProsesBisnisDto } from '@/types/dto/persetujuan.dto'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'

export type KeputusanPemeriksaanProsesBisnis = 'REVISION' | 'ACCEPT'

export type KeputusanPemeriksaanProsesBisnisPayload = {
  decision: KeputusanPemeriksaanProsesBisnis
  catatan?: string
}

export const pemeriksaanProsesBisnisApi = {
  submitBatch: (detailSopIds: string[]) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PaketPemeriksaanProsesBisnisDto>>(
        '/prosesBisnis-sop/submit-review-batch',
        { detailSopIds },
      ),
    ),

  listBatches: () =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PaketPemeriksaanProsesBisnisDto[]>>(
        '/prosesBisnis-sop/review-batches',
      ),
    ),

  submit: (detailOrSopId: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/prosesBisnis-sop/${detailOrSopId}/submit-review`,
      ),
    ),

  document: (detailOrSopId: string) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/prosesBisnis-sop/${detailOrSopId}/review-document`,
      ),
    ),

  decide: (
    detailOrSopId: string,
    decision: KeputusanPemeriksaanProsesBisnis,
    catatan?: string,
  ) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/prosesBisnis-sop/${detailOrSopId}/review`,
        {
          decision,
          ...(catatan !== undefined ? { catatan } : {}),
        } satisfies KeputusanPemeriksaanProsesBisnisPayload,
      ),
  ),
}

export function usePaketPemeriksaanProsesBisnis() {
  const query = useQuery({
    queryKey: queryKeys.pemeriksaanProsesBisnis,
    queryFn: pemeriksaanProsesBisnisApi.listBatches,
  })
  return {
    packages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useSubmitPaketPemeriksaanProsesBisnis() {
  return useMutationWithToast({
    mutationFn: pemeriksaanProsesBisnisApi.submitBatch,
    invalidateKeys: [queryKeys.sop, queryKeys.pemeriksaanProsesBisnis],
    successMessage: 'Paket Pemeriksaan berhasil diajukan',
    errorMessagePrefix: 'Gagal mengajukan Paket Pemeriksaan',
  })
}
