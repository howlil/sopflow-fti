import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import {
  expectProcessDraftInMemberQueue,
  expectProcessReviewInOwnerQueue,
  expectProcessRevisionInMemberQueue,
  requestProcessRevisionViaUi,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'

test.describe('End-to-End Business Journey — Department Process owner review', () => {
  test('J13 Department Process Review — Member submit, Owner review, lalu kembali revisi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedReadyProcessSop(roleApi, 'J13-DEPT-REVIEW', {
      actor: targetUsers.departmentMember,
      processName: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
    })

    await test.step('Department Member melihat draft pada work queue', async () => {
      const member = await roleSession(targetUsers.departmentMember)
      await expectProcessDraftInMemberQueue(member.page, sop.title)
    })

    await test.step('Department Member mengirim SOP lengkap untuk Process Owner review', async () => {
      const member = await roleSession(targetUsers.departmentMember)
      await submitProcessSopForReviewViaUi(member.page, sop.detailSopId)
    })

    await test.step('Relevant Process Owner menerima pekerjaan review', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await expectProcessReviewInOwnerQueue(owner.page, sop.title)
    })

    await test.step('Relevant Process Owner mengembalikan SOP untuk revisi', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await requestProcessRevisionViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Department Member menerima kembali SOP revisi dan Department B tetap ditolak', async () => {
      const member = await roleSession(targetUsers.departmentMember)
      await expectProcessRevisionInMemberQueue(member.page, sop.title)

      const unrelatedApi = await roleApi(targetUsers.otherDepartmentMember)
      const response = await unrelatedApi.get(
        toApiUrl(`/process-sop/workbench/${sop.detailSopId}`),
      )
      expect(response.status()).toBe(403)
    })
  })
})
