import { test, expect } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet } from '../support/api'
import {
  acceptProcessSopViaUi,
  approveProcessSopViaUi,
  openFinalApprovalFromNotification,
} from '../support/fti-approval-actions'
import { seedProcessSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'

interface ProcessNotification {
  title: string
  preview: string
}

test.describe('End-to-End Business Journey — Department final approval', () => {
  test('J14 Department Final Approval — relevant Kadep menerima notifikasi dan authority terisolasi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProcessSopAwaitingOwnerReview(roleApi, 'J14-DEPT-APPROVAL', {
      actor: targetUsers.departmentMember,
      processName: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
    })

    await test.step('Relevant Process Owner menerima SOP Department untuk final approval handoff', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await acceptProcessSopViaUi(owner.page, sop.detailSopId)
    })

    await test.step('FINAL_APPROVAL_REQUESTED hanya dikirim ke Kadep Department yang relevan', async () => {
      const relevantApi = await roleApi(targetUsers.headOfDepartment)
      const deanApi = await roleApi(targetUsers.dean)
      const otherHeadApi = await roleApi(targetUsers.otherHeadOfDepartment)
      const expectedPreview = `SOP pada Process ${sop.processName} menunggu persetujuan akhir Anda.`

      const relevantNotifications = await apiGet<ProcessNotification[]>(
        relevantApi,
        '/notifications/process?limit=20',
      )
      const deanNotifications = await apiGet<ProcessNotification[]>(deanApi, '/notifications/process?limit=20')
      const otherNotifications = await apiGet<ProcessNotification[]>(
        otherHeadApi,
        '/notifications/process?limit=20',
      )

      expect(relevantNotifications.some((item) => item.preview === expectedPreview)).toBe(true)
      expect(deanNotifications.some((item) => item.preview === expectedPreview)).toBe(false)
      expect(otherNotifications.some((item) => item.preview === expectedPreview)).toBe(false)
    })

    await test.step('Dean, Kadep Department lain, dan SUPER_ADMIN tidak dapat approve SOP Department A', async () => {
      const deniedUsers = [targetUsers.dean, targetUsers.otherHeadOfDepartment, users.pjEvaluator]
      for (const user of deniedUsers) {
        const api = await roleApi(user)
        const response = await api.post(`/process-approval/${sop.detailSopId}/approve`)
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Relevant Kadep membuka notifikasi dan memberi persetujuan akhir', async () => {
      const head = await roleSession(targetUsers.headOfDepartment)
      await openFinalApprovalFromNotification(head.page, sop.processName)
      await approveProcessSopViaUi(
        head.page,
        sop.title,
        'Teknik Informatika · Kepala Departemen',
      )
    })
  })
})
