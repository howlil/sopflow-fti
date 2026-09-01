import { targetUsers, type E2eUser } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import { ensureTteReady } from './e2e-flow'
import { seedProcessSopAwaitingOwnerReview } from './fti-approval-preconditions'
import type {
  ProcessSopSeedOptions,
  ReadyProcessSopFixture,
} from './fti-process-preconditions'

interface ApprovalRow {
  detailSopId: string
  approval: unknown | null
}

interface ProcessTteSeedOptions extends ProcessSopSeedOptions {
  authorityUser?: E2eUser
}

/**
 * TTE/public journey precondition. Submit, Owner ACCEPT, dan final approval yang sudah
 * dibuktikan oleh journey sebelumnya dilakukan via API; signing tetap browser action.
 */
export async function seedProcessSopReadyForTte(
  apiFor: RoleApiFactory,
  prefix = 'FTI-TTE',
  options: ProcessTteSeedOptions = {},
): Promise<ReadyProcessSopFixture> {
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const sop = await seedProcessSopAwaitingOwnerReview(apiFor, prefix, options)
  const ownerApi = await apiFor(targetUsers.processOwner)
  const authorityApi = await apiFor(authorityUser)

  await apiPost(ownerApi, `/process-sop/${sop.detailSopId}/review`, {
    decision: 'ACCEPT',
  })
  await apiPost(authorityApi, `/process-approval/${sop.detailSopId}/approve`)
  await ensureTteReady(authorityApi)

  const rows = await apiGet<ApprovalRow[]>(authorityApi, '/process-approval')
  const row = rows.find((candidate) => candidate.detailSopId === sop.detailSopId)
  if (!row || row.approval === null) {
    throw new Error('Precondition Process TTE harus memiliki final approval dan siap TTE')
  }

  return sop
}

export async function seedProcessSopReadyForDeanTte(
  apiFor: RoleApiFactory,
  prefix = 'FTI-TTE',
): Promise<ReadyProcessSopFixture> {
  return seedProcessSopReadyForTte(apiFor, prefix)
}
