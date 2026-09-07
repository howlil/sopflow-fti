import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import {
  acceptProsesBisnisSopViaUi,
  approveProsesBisnisSopViaUi,
  openFinalApprovalFromNotification,
} from '../support/fti-approval-actions'
import { seedProsesBisnisSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'

interface NotifikasiProsesBisnis {
  title: string
  preview: string
}

test.describe('End-to-End Business Journey — Departemen persetujuan akhir', () => {
  test('J14 Departemen Persetujuan Akhir — relevant Kadep menerima notifikasi dan authority terisolasi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProsesBisnisSopAwaitingOwnerReview(roleApi, 'J14-DEPT-APPROVAL', {
      actor: targetUsers.departmentMember,
      namaProsesBisnis: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
    })

    await test.step('Relevant Penanggung Jawab Proses Bisnis menerima SOP Departemen untuk persetujuan akhir handoff', async () => {
      const owner = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await acceptProsesBisnisSopViaUi(owner.page, sop.detailSopId)
    })

    await test.step('FINAL_APPROVAL_REQUESTED hanya dikirim ke Kadep Departemen yang relevan', async () => {
      const relevantApi = await roleApi(targetUsers.headOfDepartemen)
      const deanApi = await roleApi(targetUsers.dean)
      const otherHeadApi = await roleApi(targetUsers.otherHeadOfDepartemen)
      const expectedPreview = `SOP pada ProsesBisnis ${sop.namaProsesBisnis} menunggu persetujuan akhir Anda.`

      const relevantNotifications = await apiGet<NotifikasiProsesBisnis[]>(
        relevantApi,
        '/notifications/proses-bisnis?limit=20',
      )
      const deanNotifications = await apiGet<NotifikasiProsesBisnis[]>(deanApi, '/notifications/proses-bisnis?limit=20')
      const otherNotifications = await apiGet<NotifikasiProsesBisnis[]>(
        otherHeadApi,
        '/notifications/proses-bisnis?limit=20',
      )

      expect(relevantNotifications.some((item) => item.preview === expectedPreview)).toBe(true)
      expect(deanNotifications.some((item) => item.preview === expectedPreview)).toBe(false)
      expect(otherNotifications.some((item) => item.preview === expectedPreview)).toBe(false)
    })

    await test.step('Dean, Kadep Departemen lain, dan SUPER_ADMIN tidak dapat approve SOP Departemen A', async () => {
      const deniedUsers = [targetUsers.dean, targetUsers.otherHeadOfDepartemen, targetUsers.admin]
      for (const user of deniedUsers) {
        const api = await roleApi(user)
        const response = await api.post(toApiUrl(`/persetujuan-akhir-sop/${sop.detailSopId}/approve`))
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Relevant Kadep membuka notifikasi dan memberi persetujuan akhir', async () => {
      const head = await roleSession(targetUsers.headOfDepartemen)
      await openFinalApprovalFromNotification(head.page, sop.namaProsesBisnis)
      await approveProsesBisnisSopViaUi(
        head.page,
        sop.title,
        'Teknik Informatika · Kepala Departemen',
      )
    })
  })
})
