import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import {
  seedReadyProcessSop,
  type ProcessSopSeedOptions,
  type ReadyProcessSopFixture,
} from './fti-process-preconditions'

interface Workbench {
  detail: {
    status: string
  }
}

/**
 * Submit lewat API adalah precondition untuk journey yang fokus pada Owner ACCEPT /
 * contextual final approval. Browser submit sendiri sudah dibuktikan oleh J09/J13.
 */
export async function seedProcessSopAwaitingOwnerReview(
  apiFor: RoleApiFactory,
  prefix = 'FTI-APPROVAL',
  options: ProcessSopSeedOptions = {},
): Promise<ReadyProcessSopFixture> {
  const actor = options.actor ?? targetUsers.processMember
  const sop = await seedReadyProcessSop(apiFor, prefix, options)
  const memberApi = await apiFor(actor)

  await apiPost(memberApi, `/process-sop/${sop.detailSopId}/submit-review`)

  const workbench = await apiGet<Workbench>(
    memberApi,
    `/process-sop/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'SEDANG_DIEVALUASI') {
    throw new Error(
      `Precondition harus menunggu Process Owner review, ditemukan ${workbench.detail.status}`,
    )
  }

  return sop
}
