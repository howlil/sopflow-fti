import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import {
  acceptProsesBisnisSopViaUi,
  approveFacultyProsesBisnisSopViaUi,
  openFinalApprovalFromDeanNotification,
} from '../support/fti-approval-actions'
import { seedProsesBisnisSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'

test.describe('End-to-End Business Journey — contextual persetujuan akhir', () => {
  test('J10 Persetujuan Akhir Notification — Owner accept, Dean notified, lalu approve', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProsesBisnisSopAwaitingOwnerReview(roleApi, 'J10-FINAL-APPROVAL')
    const deanApi = await roleApi(targetUsers.dean)

    await test.step('Isolasi notifikasi Proses Bisnis Dean dari journey sebelumnya', async () => {
      const response = await deanApi.post(toApiUrl('/notifications/process/read-all'))
      expect(response.status()).toBe(201)
    })

    await test.step('Penanggung Jawab Proses Bisnis menerima SOP melalui UI', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await acceptProsesBisnisSopViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Dekan menerima tepat satu contextual notification baru', async () => {
      const response = await deanApi.get(toApiUrl('/notifications/process?limit=50'))
      expect(response.status()).toBe(200)
      const payload = (await response.json()) as {
        data: Array<{
          title: string
          preview: string
          readAt: string | null
        }>
      }
      const fresh = payload.data.filter(
        (item) =>
          item.readAt === null &&
          item.title === 'Persetujuan akhir SOP diperlukan' &&
          item.preview ===
            `SOP pada ProsesBisnis ${sop.namaProsesBisnis} menunggu persetujuan akhir Anda.`,
      )
      expect(fresh).toHaveLength(1)
    })

    await test.step('Dekan membuka contextual notification ke Persetujuan Akhir', async () => {
      const dean = await roleSession(targetUsers.dean)
      await openFinalApprovalFromDeanNotification(dean.page, sop.namaProsesBisnis)
    })

    await test.step('Dekan menyetujui SOP fakultas dan meninggalkannya siap TTE', async () => {
      const dean = await roleSession(targetUsers.dean)
      await dean.page.goto('/approval')
      await approveFacultyProsesBisnisSopViaUi(dean.page, sop.title)
    })
  })
})
