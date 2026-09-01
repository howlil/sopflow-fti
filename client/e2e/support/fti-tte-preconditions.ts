import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import { ensureTteReady } from './e2e-flow'
import { seedProcessSopAwaitingOwnerReview } from './fti-approval-preconditions'
import type { ReadyProcessSopFixture } from './fti-process-preconditions'

interface ApprovalRow {
  detailSopId: string
  approval: unknown | null
}

/**
 * J11 hanya menguji TTE + public handoff. Submit, Owner ACCEPT, dan Dean approval
 * sudah browser-verified oleh J09/J10, sehingga ketiganya menjadi precondition API.
 */
export async function seedProcessSopReadyForDeanTte(
  apiFor: RoleApiFactory,
  prefix = 'FTI-TTE',
): Promise<ReadyProcessSopFixture> {
  const sop = await seedProcessSopAwaitingOwnerReview(apiFor, prefix)
  const ownerApi = await apiFor(targetUsers.processOwner)
  const deanApi = await apiFor(targetUsers.dean)

  await apiPost(ownerApi, `/process-sop/${sop.detailSopId}/review`, {
    decision: 'ACCEPT',
  })
  await apiPost(deanApi, `/process-approval/${sop.detailSopId}/approve`)
  await ensureTteReady(deanApi)

  const rows = await apiGet<ApprovalRow[]>(deanApi, '/process-approval')
  const row = rows.find((candidate) => candidate.detailSopId === sop.detailSopId)
  if (!row || row.approval === null) {
    throw new Error('Precondition J11 harus memiliki final approval dan siap TTE')
  }

  return sop
}
