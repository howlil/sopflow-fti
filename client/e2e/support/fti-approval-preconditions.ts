import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import {
  seedReadyProsesBisnisSop,
  type ProsesBisnisSopSeedOptions,
  type ReadyProsesBisnisSopFixture,
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
export async function seedProsesBisnisSopAwaitingOwnerReview(
  apiFor: RoleApiFactory,
  prefix = 'FTI-APPROVAL',
  options: ProsesBisnisSopSeedOptions = {},
): Promise<ReadyProsesBisnisSopFixture> {
  const actor = options.actor ?? targetUsers.anggotaProsesBisnis
  const sop = await seedReadyProsesBisnisSop(apiFor, prefix, options)
  const memberApi = await apiFor(actor)

  await apiPost(memberApi, `/sop-proses-bisnis/${sop.detailSopId}/submit-review`)

  const workbench = await apiGet<Workbench>(
    memberApi,
    `/sop-proses-bisnis/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'PROCESS_REVIEW') {
    throw new Error(
      `Precondition harus menunggu ProsesBisnis Owner review, ditemukan ${workbench.detail.status}`,
    )
  }

  return sop
}
