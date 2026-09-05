import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { waitForAppReady } from '../support/app'
import { ensureTteReady } from '../support/e2e-flow'
import {
  acceptProcessSopViaUi,
  approveProcessSopViaUi,
} from '../support/fti-approval-actions'
import {
  expectProcessDraftInMemberQueue,
  expectProcessRevisionInMemberQueue,
  expectProcessReviewInOwnerQueue,
  requestProcessRevisionViaUi,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import {
  expectProcessSopBerlakuInWorkQueue,
  expectProcessSopInPublicArchive,
  signProcessSopViaUi,
} from '../support/fti-tte-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'
import {
  getProcessVersionHistory,
  seedPublishedProcessSop,
} from '../support/fti-version-preconditions'
import {
  expectProcessSopAbsentFromPublicArchive,
  revokeProcessSopViaApi,
} from '../support/fti-revocation-actions'

test.describe('M13 Native FTI lifecycle qualification', () => {
  test('S4-S5 member -> owner -> revision -> resubmit -> approval -> TTE', async ({
    roleApi,
    roleSession,
    publicPage,
  }) => {
    test.setTimeout(90_000)
    const sop = await seedReadyProcessSop(roleApi, 'M13-S45')

    const member = await roleSession(targetUsers.processMember)
    await expectProcessDraftInMemberQueue(member.page, sop.title)
    await submitProcessSopForReviewViaUi(member.page, sop.detailSopId)

    const owner = await roleSession(targetUsers.processOwner)
    await expectProcessReviewInOwnerQueue(owner.page, sop.title)
    await requestProcessRevisionViaUi(owner.page, sop.detailSopId)

    await expectProcessRevisionInMemberQueue(member.page, sop.title)
    await submitProcessSopForReviewViaUi(member.page, sop.detailSopId)

    await expectProcessReviewInOwnerQueue(owner.page, sop.title)
    await acceptProcessSopViaUi(owner.page, sop.detailSopId)

    const dean = await roleSession(targetUsers.dean)
    await dean.page.goto('/approval')
    await waitForAppReady(dean.page)
    await approveProcessSopViaUi(dean.page, sop.title, 'Fakultas · Dekan')

    await ensureTteReady(await roleApi(targetUsers.dean))
    await signProcessSopViaUi(dean.page, sop.title)

    await expectProcessSopBerlakuInWorkQueue(member.page, sop.title)
    await expectProcessSopInPublicArchive(publicPage, sop.title)
  })

  test('S6 effective -> revoke -> public removed while history remains', async ({
    roleApi,
    publicPage,
  }) => {
    const sop = await seedPublishedProcessSop(roleApi, 'M13-S6-REVOKE', {
      authorityUser: targetUsers.dean,
    })

    await expectProcessSopInPublicArchive(publicPage, sop.title)
    const result = await revokeProcessSopViaApi(
      await roleApi(targetUsers.dean),
      sop.detailSopId,
    )

    expect(result.status).toBe('DICABUT')
    await expectProcessSopAbsentFromPublicArchive(publicPage, sop.title)

    const history = await getProcessVersionHistory(
      roleApi,
      targetUsers.processMember,
      sop.sopId,
    )
    expect(
      history.some(
        (row) => row.detailSopId === sop.detailSopId && row.status === 'DICABUT',
      ),
    ).toBe(true)
  })
})
