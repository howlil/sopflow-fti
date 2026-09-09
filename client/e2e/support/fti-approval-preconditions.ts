import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import {
  seedReadyProsesBisnisSop,
  type ProsesBisnisSopSeedOptions,
  type ReadyProsesBisnisSopFixture,
} from './fti-proses-bisnis-preconditions'

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

  await apiPost(memberApi, `/prosesBisnis-sop/${sop.detailSopId}/submit-review`)

  const workbench = await apiGet<Workbench>(
    memberApi,
    `/prosesBisnis-sop/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'PROCESS_REVIEW') {
    throw new Error(
      `Precondition harus menunggu ProsesBisnis Owner review, ditemukan ${workbench.detail.status}`,
    )
  }

  return sop
}
