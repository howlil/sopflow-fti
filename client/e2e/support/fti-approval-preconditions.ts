import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import {
  seedReadyProcessSop,
  type ReadyProcessSopFixture,
} from './fti-process-preconditions'

interface Workbench {
  detail: {
    status: string
  }
}

/**
 * J10 berfokus pada keputusan ACCEPT Process Owner dan contextual final approval.
 * Submit Member sudah dibuktikan via browser oleh J09, sehingga tahap tersebut menjadi
 * precondition API agar J10 tidak menduplikasi business action yang sudah verified.
 */
export async function seedProcessSopAwaitingOwnerReview(
  apiFor: RoleApiFactory,
  prefix = 'FTI-APPROVAL',
): Promise<ReadyProcessSopFixture> {
  const sop = await seedReadyProcessSop(apiFor, prefix)
  const memberApi = await apiFor(targetUsers.processMember)

  await apiPost(
    memberApi,
    `/process-sop/${sop.detailSopId}/submit-review`,
  )

  const workbench = await apiGet<Workbench>(
    memberApi,
    `/process-sop/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'SEDANG_DIEVALUASI') {
    throw new Error(
      `Precondition J10 harus menunggu Process Owner review, ditemukan ${workbench.detail.status}`,
    )
  }

  return sop
}
