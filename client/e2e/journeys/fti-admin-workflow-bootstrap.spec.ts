import { test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { ensureTteReady } from '../support/e2e-flow'
import {
  createDepartmentProcessViaAdminUi,
  createDepartmentViaAdminUi,
  assignDepartmentHeadViaAdminUi,
} from '../support/fti-admin-actions'
import {
  acceptProcessSopViaUi,
  approveProcessSopViaUi,
  openFinalApprovalFromNotification,
} from '../support/fti-approval-actions'
import {
  expectProcessDraftInMemberQueue,
  expectProcessReviewInOwnerQueue,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'
import {
  expectProcessSopBerlakuInWorkQueue,
  expectProcessSopInPublicArchive,
  signProcessSopViaUi,
} from '../support/fti-tte-actions'
import { e2eRunId } from '../support/test-data'

test.describe('End-to-End Business Journey — configured FTI workflow bootstrap', () => {
  test('J23 Configuration Workflow Bootstrap — runtime admin config drives SOP through TTE/public', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J23')
    const departmentName = `M6 Bootstrap ${suffix}`
    const processName = `M6 Workflow ${suffix}`

    await test.step('SUPER_ADMIN creates the Department and Process Team through target UI', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentViaAdminUi(admin.page, departmentName)
      await createDepartmentProcessViaAdminUi(admin.page, {
        processName,
        departmentName,
        ownerEmail: targetUsers.processOwner.email,
        memberEmails: [targetUsers.otherDepartmentMember.email],
      })
    })

    await test.step('SUPER_ADMIN assigns the runtime Department Head through target UI', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await assignDepartmentHeadViaAdminUi(
        admin.page,
        departmentName,
        targetUsers.otherHeadOfDepartment.email,
      )
      const headApi = await roleApi(targetUsers.otherHeadOfDepartment)
      await ensureTteReady(headApi)
    })

    const sop = await test.step('Runtime Process Member creates a complete target Process SOP', async () =>
      seedReadyProcessSop(roleApi, 'J23-BOOTSTRAP', {
        actor: targetUsers.otherDepartmentMember,
        processName,
        institutionName: departmentName,
      }),
    )

    await test.step('Runtime Process Member submits through the existing browser workflow', async () => {
      const member = await roleSession(targetUsers.otherDepartmentMember)
      await expectProcessDraftInMemberQueue(member.page, sop.title)
      await submitProcessSopForReviewViaUi(member.page, sop.detailSopId)
    })

    await test.step('Configured Process Owner receives and accepts the SOP', async () => {
      const owner = await roleSession(targetUsers.processOwner)
      await expectProcessReviewInOwnerQueue(owner.page, sop.title)
      await acceptProcessSopViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Configured Department Head receives contextual approval and approves', async () => {
      const head = await roleSession(targetUsers.otherHeadOfDepartment)
      await openFinalApprovalFromNotification(head.page, processName)
      await approveProcessSopViaUi(
        head.page,
        sop.title,
        `${departmentName} · Kepala Departemen`,
      )
    })

    await test.step('Configured Department Head signs through contextual TTE', async () => {
      const head = await roleSession(targetUsers.otherHeadOfDepartment)
      await signProcessSopViaUi(head.page, sop.title)
    })

    await test.step('Runtime-created Process SOP becomes effective and public', async () => {
      const member = await roleSession(targetUsers.otherDepartmentMember)
      await expectProcessSopBerlakuInWorkQueue(member.page, sop.title)
      await expectProcessSopInPublicArchive(publicPage, sop.title)
    })
  })
})
