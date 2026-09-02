import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet } from '../support/api'
import {
  createDepartmentProcessViaAdminUi,
  createDepartmentViaAdminUi,
  renameProcessViaAdminUi,
} from '../support/fti-admin-actions'
import { e2eRunId } from '../support/test-data'

interface ProcessContextRow {
  processId: string
  nama: string
  ownerId: string
  members: Array<{ penggunaId: string }>
}

test.describe('End-to-End Business Journey — Process administration', () => {
  test('J21 Process Configuration — admin creates Department/Process/team and context updates immediately', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J21')
    const departmentName = `M6 Department ${suffix}`
    const processName = `M6 Process ${suffix}`
    const renamedProcess = `${processName} Updated`

    await test.step('SUPER_ADMIN creates Department and Department Process through target UI', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentViaAdminUi(admin.page, departmentName)
      await createDepartmentProcessViaAdminUi(admin.page, {
        processName,
        departmentName,
        ownerEmail: targetUsers.processOwner.email,
        memberEmails: [targetUsers.otherDepartmentMember.email],
      })
    })

    await test.step('Owner and Member receive the new Process context', async () => {
      for (const actor of [targetUsers.processOwner, targetUsers.otherDepartmentMember]) {
        const actorApi = await roleApi(actor)
        const contexts = await apiGet<ProcessContextRow[]>(actorApi, '/process-context/mine')
        const created = contexts.find((row) => row.nama === processName)
        expect(created, `${actor.email} should receive ${processName}`).toBeDefined()
      }
    })

    await test.step('Admin edits Process and contextual reads reflect the same Process immediately', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await renameProcessViaAdminUi(admin.page, processName, renamedProcess)

      for (const actor of [targetUsers.processOwner, targetUsers.otherDepartmentMember]) {
        const actorApi = await roleApi(actor)
        const contexts = await apiGet<ProcessContextRow[]>(actorApi, '/process-context/mine')
        expect(contexts.some((row) => row.nama === renamedProcess)).toBe(true)
        expect(contexts.some((row) => row.nama === processName)).toBe(false)
      }
    })
  })
})
