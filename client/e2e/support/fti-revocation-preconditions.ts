import type { E2eUser } from '../fixtures/users'
import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory, RoleSessionFactory } from '../fixtures/business-test'
import { waitForAppReady } from './app'
import {
  acceptProcessSopViaUi,
  approveProcessSopViaUi,
} from './fti-approval-actions'
import {
  seedProcessSopAwaitingOwnerReview,
} from './fti-approval-preconditions'
import type {
  ProcessSopSeedOptions,
  ReadyProcessSopFixture,
} from './fti-process-preconditions'
import { signProcessSopViaUi } from './fti-tte-actions'
import { ensureTteReady } from './e2e-flow'

export async function seedEffectiveProcessSop(
  apiFor: RoleApiFactory,
  sessionFor: RoleSessionFactory,
  prefix: string,
  options: ProcessSopSeedOptions,
  authorityUser: E2eUser,
  authorityLabel: string,
): Promise<ReadyProcessSopFixture> {
  const sop = await seedProcessSopAwaitingOwnerReview(apiFor, prefix, options)

  const owner = await sessionFor(targetUsers.processOwner)
  await acceptProcessSopViaUi(owner.page, sop.detailSopId)

  const authority = await sessionFor(authorityUser)
  await authority.page.goto('/approval')
  await waitForAppReady(authority.page)
  await approveProcessSopViaUi(authority.page, sop.title, authorityLabel)

  await ensureTteReady(await apiFor(authorityUser))
  await signProcessSopViaUi(authority.page, sop.title)

  return sop
}
