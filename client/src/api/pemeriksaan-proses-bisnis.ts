import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { PenyusunWorkbenchData } from '@/types/dto/sop.dto'

export type KeputusanPemeriksaanProsesBisnis = 'REVISION' | 'ACCEPT'

export type KeputusanPemeriksaanProsesBisnisPayload = {
  decision: KeputusanPemeriksaanProsesBisnis
  catatan?: string
}

export const pemeriksaanProsesBisnisApi = {
  submit: (detailOrSopId: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop-proses-bisnis/${detailOrSopId}/submit-review`,
      ),
    ),

  decide: (
    detailOrSopId: string,
    decision: KeputusanPemeriksaanProsesBisnis,
    catatan?: string,
  ) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/sop-proses-bisnis/${detailOrSopId}/review`,
        {
          decision,
          ...(catatan !== undefined ? { catatan } : {}),
        } satisfies KeputusanPemeriksaanProsesBisnisPayload,
      ),
    ),
}
