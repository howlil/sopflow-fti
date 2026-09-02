import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, apiPost, toApiUrl } from '../support/api'
import {
  assignDeanViaAdminUi,
  assignDepartmentHeadViaAdminUi,
} from '../support/fti-admin-actions'
import { e2eRunId } from '../support/test-data'

interface DepartmentRow {
  departmentId: string
  nama: string
}

interface AuthorityRow {
  authority: 'DEAN' | 'HEAD_OF_DEPARTMENT'
  departmentId: string | null
  holderId: string
}

test.describe('End-to-End Business Journey — organizational authority administration', () => {
  test('J22 Authority Configuration — admin changes Dean/Kadep while non-admin mutation stays denied', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J22')
    const departmentName = `M6 Authority ${suffix}`
    const adminApi = await roleApi(users.pjEvaluator)
    const configuration = await apiGet<AuthorityRow[]>(
      adminApi,
      '/organizational-authority/configuration',
    )
    const originalDean = configuration.find((row) => row.authority === 'DEAN')
    if (!originalDean) throw new Error('Dean awal wajib tersedia untuk restore J22')

    const department = await apiPost<DepartmentRow>(adminApi, '/process-admin/departments', {
      nama: departmentName,
    })

    try {
      await test.step('SUPER_ADMIN can change Dean through target authority UI', async () => {
        const admin = await roleSession(users.pjEvaluator)
        await assignDeanViaAdminUi(admin.page, targetUsers.otherHeadOfDepartment.email)

        const alternateApi = await roleApi(targetUsers.otherHeadOfDepartment)
        await expect
          .poll(async () => {
            const rows = await apiGet<AuthorityRow[]>(alternateApi, '/organizational-authority/mine')
            return rows.some((row) => row.authority === 'DEAN')
          })
          .toBe(true)
      })

      await test.step('SUPER_ADMIN assigns the unique Department Head through target UI', async () => {
        const admin = await roleSession(users.pjEvaluator)
        await assignDepartmentHeadViaAdminUi(
          admin.page,
          departmentName,
          targetUsers.headOfDepartment.email,
        )

        const headApi = await roleApi(targetUsers.headOfDepartment)
        await expect
          .poll(async () => {
            const rows = await apiGet<AuthorityRow[]>(headApi, '/organizational-authority/mine')
            return rows.some(
              (row) =>
                row.authority === 'HEAD_OF_DEPARTMENT' &&
                row.departmentId === department.departmentId,
            )
          })
          .toBe(true)
      })

      await test.step('Normal USER cannot mutate organizational authority', async () => {
        const memberApi = await roleApi(targetUsers.processMember)
        const response = await memberApi.put(
          toApiUrl(`/organizational-authority/departments/${department.departmentId}/head`),
          { data: { penggunaId: targetUsers.processMember.email } },
        )
        expect(response.status()).toBe(403)
      })
    } finally {
      const restore = await adminApi.put(toApiUrl('/organizational-authority/dean'), {
        data: { penggunaId: originalDean.holderId },
      })
      expect(restore.status(), 'restore seeded Dean').toBe(200)
    }

    await test.step('Global Dean assignment is restored after the journey', async () => {
      const deanApi = await roleApi(targetUsers.dean)
      const rows = await apiGet<AuthorityRow[]>(deanApi, '/organizational-authority/mine')
      expect(rows.some((row) => row.authority === 'DEAN')).toBe(true)
    })
  })
})
