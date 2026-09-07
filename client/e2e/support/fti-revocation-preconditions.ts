import type { E2eUser } from '../fixtures/users'
import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory, RoleSessionFactory } from '../fixtures/business-test'
import { waitForAppReady } from './app'
import {
  acceptProsesBisnisSopViaUi,
  approveProsesBisnisSopViaUi,
} from './fti-approval-actions'
import {
  seedProsesBisnisSopAwaitingOwnerReview,
} from './fti-approval-preconditions'
import type {
  ProsesBisnisSopSeedOptions,
  ReadyProsesBisnisSopFixture,
} from './fti-process-preconditions'
import { signProsesBisnisSopViaUi } from './fti-tte-actions'
import { ensureTteReady } from './e2e-flow'

export async function seedEffectiveProsesBisnisSop(
  apiFor: RoleApiFactory,
  sessionFor: RoleSessionFactory,
  prefix: string,
  options: ProsesBisnisSopSeedOptions,
  authorityUser: E2eUser,
  authorityLabel: string,
): Promise<ReadyProsesBisnisSopFixture> {
  const sop = await seedProsesBisnisSopAwaitingOwnerReview(apiFor, prefix, options)

  const owner = await sessionFor(targetUsers.processOwner)
  await acceptProsesBisnisSopViaUi(owner.page, sop.detailSopId)

  const authority = await sessionFor(authorityUser)
  await authority.page.goto('/approval')
  await waitForAppReady(authority.page)
  await approveProsesBisnisSopViaUi(authority.page, sop.title, authorityLabel)

  await ensureTteReady(await apiFor(authorityUser))
  await signProsesBisnisSopViaUi(authority.page, sop.title)

  return sop
}
