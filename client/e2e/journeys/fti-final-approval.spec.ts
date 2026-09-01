import { test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  acceptProcessSopViaUi,
  approveFacultyProcessSopViaUi,
  openFinalApprovalFromDeanNotification,
} from '../support/fti-approval-actions'
import { seedProcessSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'

test.describe('End-to-End Business Journey — contextual final approval', () => {
  test('J10 Final Approval Notification — Owner accept, Dean notified, lalu approve', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProcessSopAwaitingOwnerReview(roleApi, 'J10-FINAL-APPROVAL')

    await test.step('Process Owner menerima SOP melalui UI', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await acceptProcessSopViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Dekan menerima contextual notification dan masuk ke Persetujuan Akhir', async () => {
      const dean = await roleSession(targetUsers.dean)
      await openFinalApprovalFromDeanNotification(dean.page, sop.processName)
    })

    await test.step('Dekan menyetujui SOP fakultas dan meninggalkannya siap TTE', async () => {
      const dean = await roleSession(targetUsers.dean)
      await dean.page.goto('/approval')
      await approveFacultyProcessSopViaUi(dean.page, sop.title)
    })
  })
})
