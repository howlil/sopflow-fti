import { targetUsers, type E2eUser } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPost } from './api'
import { ensureTteReady } from './e2e-flow'
import { seedProsesBisnisSopAwaitingOwnerReview } from './fti-approval-preconditions'
import type {
  ProsesBisnisSopSeedOptions,
  ReadyProsesBisnisSopFixture,
} from './fti-proses-bisnis-preconditions'

interface ApprovalRow {
  detailSopId: string
  approval: unknown | null
}

interface ProsesBisnisTteSeedOptions extends ProsesBisnisSopSeedOptions {
  authorityUser?: E2eUser
}

/**
 * TTE/public journey precondition. Submit, Owner ACCEPT, dan final approval yang sudah
 * dibuktikan oleh journey sebelumnya dilakukan via API; signing tetap browser action.
 */
export async function seedProsesBisnisSopReadyForTte(
  apiFor: RoleApiFactory,
  prefix = 'FTI-TTE',
  options: ProsesBisnisTteSeedOptions = {},
): Promise<ReadyProsesBisnisSopFixture> {
  const authorityUser = options.authorityUser ?? targetUsers.dean
  const sop = await seedProsesBisnisSopAwaitingOwnerReview(apiFor, prefix, options)
  const ownerApi = await apiFor(targetUsers.penanggungJawabProsesBisnis)
  const authorityApi = await apiFor(authorityUser)

  await apiPost(ownerApi, `/prosesBisnis-sop/${sop.detailSopId}/review`, {
    decision: 'ACCEPT',
  })
  await apiPost(authorityApi, `/persetujuan-proses-bisnis/${sop.detailSopId}/approve`)
  await ensureTteReady(authorityApi)

  const rows = await apiGet<ApprovalRow[]>(authorityApi, '/persetujuan-proses-bisnis')
  const row = rows.find((candidate) => candidate.detailSopId === sop.detailSopId)
  if (!row || row.approval === null) {
    throw new Error('Precondition Proses Bisnis TTE harus memiliki persetujuan akhir dan siap TTE')
  }

  return sop
}

export async function seedProsesBisnisSopReadyForDeanTte(
  apiFor: RoleApiFactory,
  prefix = 'FTI-TTE',
): Promise<ReadyProsesBisnisSopFixture> {
  return seedProsesBisnisSopReadyForTte(apiFor, prefix)
}
