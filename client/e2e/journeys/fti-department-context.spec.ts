import { test, expect } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import { seedReadyProsesBisnisSop } from '../support/fti-process-preconditions'

interface ProsesBisnisContextRow {
  prosesBisnisId: string
  nama: string
}

test.describe('End-to-End Business Journey — Departemen context isolation', () => {
  test('J12 Departemen Context Isolation — Proses Bisnis dan authority tidak bocor antar Departemen', async ({
    roleApi,
    roleSession,
  }) => {
    await test.step('Member tiap Departemen menerima context sendiri tanpa context canonical Departemen lain', async () => {
      const ifApi = await roleApi(targetUsers.departmentMember)
      const siApi = await roleApi(targetUsers.otherDepartemenMember)
      const ifProsesBisnises = await apiGet<ProsesBisnisContextRow[]>(ifApi, '/konteks-proses-bisnis/mine')
      const siProsesBisnises = await apiGet<ProsesBisnisContextRow[]>(siApi, '/konteks-proses-bisnis/mine')
      const ifNames = ifProsesBisnises.map((row) => row.nama)
      const siNames = siProsesBisnises.map((row) => row.nama)

      expect(ifNames).toContain('Layanan Akademik Informatika')
      expect(ifNames).not.toContain('Layanan Akademik Sistem Informasi')
      expect(siNames).toContain('Layanan Akademik Sistem Informasi')
      expect(siNames).not.toContain('Layanan Akademik Informatika')

      for (const user of [targetUsers.departmentMember, targetUsers.otherDepartemenMember]) {
        const { page } = await roleSession(user)
        await page.goto('/work')
        await waitForAppReady(page)
        await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
        await expect(
          page.getByText(/\d+ ProsesBisnis sebagai Owner · [1-9]\d* sebagai Member\./),
        ).toBeVisible()
        await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
        await expectNoAppShellError(page)
      }
    })

    await test.step('Setiap Kepala Departemen memiliki authority context tanpa authoring Proses Bisnis', async () => {
      for (const user of [targetUsers.headOfDepartemen, targetUsers.otherHeadOfDepartemen]) {
        const { page } = await roleSession(user)
        await page.goto('/work')
        await waitForAppReady(page)
        await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
        await expect(page.getByText(/[1-9]\d* kewenangan organisasi aktif\./)).toBeVisible()
        await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
        await expectNoAppShellError(page)
      }
    })

    await test.step('Unrelated Departemen anggota dan SUPER_ADMIN ditolak dari workbench Departemen A', async () => {
      const sop = await seedReadyProsesBisnisSop(roleApi, 'J12-DEPT-ISOLATION', {
        actor: targetUsers.departmentMember,
        namaProsesBisnis: 'Layanan Akademik Informatika',
        institutionName: 'Departemen Teknik Informatika',
      })

      const unrelatedApi = await roleApi(targetUsers.otherDepartemenMember)
      const unrelatedResponse = await unrelatedApi.get(
        toApiUrl(`/sop-proses-bisnis/workbench/${sop.detailSopId}`),
      )
      expect(unrelatedResponse.status()).toBe(403)

      const superAdminApi = await roleApi(users.pjEvaluator)
      const superAdminResponse = await superAdminApi.get(
        toApiUrl(`/sop-proses-bisnis/workbench/${sop.detailSopId}`),
      )
      expect(superAdminResponse.status()).toBe(403)
    })
  })
})
