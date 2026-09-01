import { test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  expectProcessDraftInMemberQueue,
  expectProcessReviewInOwnerQueue,
  expectProcessRevisionInMemberQueue,
  requestProcessRevisionViaUi,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'

test.describe('End-to-End Business Journey — Process work and owner review', () => {
  test('J09 Process Owner Review — Member submit, Owner review, lalu kembali revisi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedReadyProcessSop(roleApi, 'J09-PROCESS-REVIEW')

    await test.step('Process Member melihat draft Process pada work queue', async () => {
      const member = await roleSession(targetUsers.processMember)
      await expectProcessDraftInMemberQueue(member.page, sop.title)
    })

    await test.step('Process Member mengirim SOP lengkap untuk review melalui UI', async () => {
      const member = await roleSession(targetUsers.processMember)
      await submitProcessSopForReviewViaUi(member.page, sop.detailSopId)
    })

    await test.step('Process Owner melihat SOP sebagai review yang memerlukan tindakan', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await expectProcessReviewInOwnerQueue(owner.page, sop.title)
    })

    await test.step('Process Owner mengembalikan SOP untuk revisi melalui UI', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await requestProcessRevisionViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Process Member menerima kembali SOP sebagai pekerjaan revisi', async () => {
      const member = await roleSession(targetUsers.processMember)
      await expectProcessRevisionInMemberQueue(member.page, sop.title)
    })
  })
})
