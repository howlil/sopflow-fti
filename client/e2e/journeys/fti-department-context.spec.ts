import { test, expect } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'

interface ProcessContextRow {
  processId: string
  nama: string
}

test.describe('End-to-End Business Journey — Department context isolation', () => {
  test('J12 Department Context Isolation — Process dan authority tidak bocor antar Departemen', async ({
    roleApi,
    roleSession,
  }) => {
    await test.step('Member tiap Departemen menerima context sendiri tanpa context canonical Departemen lain', async () => {
      const ifApi = await roleApi(targetUsers.departmentMember)
      const siApi = await roleApi(targetUsers.otherDepartmentMember)
      const ifProcesses = await apiGet<ProcessContextRow[]>(ifApi, '/process-context/mine')
      const siProcesses = await apiGet<ProcessContextRow[]>(siApi, '/process-context/mine')
      const ifNames = ifProcesses.map((row) => row.nama)
      const siNames = siProcesses.map((row) => row.nama)

      expect(ifNames).toContain('Layanan Akademik Informatika')
      expect(ifNames).not.toContain('Layanan Akademik Sistem Informasi')
      expect(siNames).toContain('Layanan Akademik Sistem Informasi')
      expect(siNames).not.toContain('Layanan Akademik Informatika')

      for (const user of [targetUsers.departmentMember, targetUsers.otherDepartmentMember]) {
        const { page } = await roleSession(user)
        await page.goto('/work')
        await waitForAppReady(page)
        await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
        await expect(
          page.getByText(/\d+ Process sebagai Owner · [1-9]\d* sebagai Member\./),
        ).toBeVisible()
        await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
        await expectNoAppShellError(page)
      }
    })

    await test.step('Setiap Kepala Departemen memiliki authority context tanpa authoring Process', async () => {
      for (const user of [targetUsers.headOfDepartment, targetUsers.otherHeadOfDepartment]) {
        const { page } = await roleSession(user)
        await page.goto('/work')
        await waitForAppReady(page)
        await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
        await expect(page.getByText(/[1-9]\d* kewenangan organisasi aktif\./)).toBeVisible()
        await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
        await expectNoAppShellError(page)
      }
    })

    await test.step('Unrelated Department member dan SUPER_ADMIN ditolak dari workbench Department A', async () => {
      const sop = await seedReadyProcessSop(roleApi, 'J12-DEPT-ISOLATION', {
        actor: targetUsers.departmentMember,
        processName: 'Layanan Akademik Informatika',
        institutionName: 'Departemen Teknik Informatika',
      })

      const unrelatedApi = await roleApi(targetUsers.otherDepartmentMember)
      const unrelatedResponse = await unrelatedApi.get(
        toApiUrl(`/process-sop/workbench/${sop.detailSopId}`),
      )
      expect(unrelatedResponse.status()).toBe(403)

      const superAdminApi = await roleApi(users.pjEvaluator)
      const superAdminResponse = await superAdminApi.get(
        toApiUrl(`/process-sop/workbench/${sop.detailSopId}`),
      )
      expect(superAdminResponse.status()).toBe(403)
    })
  })
})
