import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { PenyusunWorkbenchData } from '@/types/dto/sop.dto'

export type ProcessReviewDecision = 'REVISION' | 'ACCEPT'

export const processReviewApi = {
  submit: (detailOrSopId: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/${detailOrSopId}/submit-review`,
      ),
    ),

  decide: (detailOrSopId: string, decision: ProcessReviewDecision) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<PenyusunWorkbenchData>>(
        `/process-sop/${detailOrSopId}/review`,
        { decision },
      ),
    ),
}
