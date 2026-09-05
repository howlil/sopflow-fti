import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { PenyusunWorkbenchData } from '@/types/dto/sop.dto'

export type ProcessReviewDecision = 'REVISION' | 'ACCEPT'

export type ProcessReviewDecisionPayload = {
  decision: ProcessReviewDecision
  catatan?: string
}

export const processReviewApi = {
  submit: (detailOrSopId: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/${detailOrSopId}/submit-review`,
      ),
    ),

  decide: (
    detailOrSopId: string,
    decision: ProcessReviewDecision,
    catatan?: string,
  ) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/${detailOrSopId}/review`,
        {
          decision,
          ...(catatan !== undefined ? { catatan } : {}),
        } satisfies ProcessReviewDecisionPayload,
      ),
    ),
}
