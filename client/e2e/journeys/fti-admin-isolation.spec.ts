import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { toApiUrl, unwrapApiData } from '../support/api'
import { sopFixture } from '../support/test-data'
import { waitForAppReady } from '../support/app'

interface ProcessRow {
  processId: string
  nama: string
}

interface AuthorityRow {
  authority: string
}

test.describe('End-to-End Business Journey — FTI administration isolation', () => {
  test('J20 Admin Entry & Isolation — SUPER_ADMIN configures platform but is not workflow authority', async ({
    roleApi,
    roleSession,
  }) => {
    await test.step('SUPER_ADMIN sees target administration navigation', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await admin.page.goto('/work')
      await waitForAppReady(admin.page)
      await expect(admin.page.getByRole('link', { name: 'Proses FTI', exact: true })).toBeVisible()
      await expect(
        admin.page.getByRole('link', { name: 'Kewenangan Organisasi', exact: true }),
      ).toBeVisible()
    })

    await test.step('Normal target USER does not receive platform administration navigation', async () => {
      const member = await roleSession(targetUsers.processMember)
      await member.page.goto('/work')
      await waitForAppReady(member.page)
      await expect(member.page.getByRole('link', { name: 'Proses FTI', exact: true })).toHaveCount(0)
      await expect(
        member.page.getByRole('link', { name: 'Kewenangan Organisasi', exact: true }),
      ).toHaveCount(0)
    })

    await test.step('Normal USER cannot mutate Process or authority administration', async () => {
      const memberApi = await roleApi(targetUsers.processMember)
      const processAdmin = await memberApi.get(toApiUrl('/process-admin/processes'))
      expect(processAdmin.status()).toBe(403)

      const authorityMutation = await memberApi.put(toApiUrl('/organizational-authority/dean'), {
        data: { penggunaId: 'not-authorized' },
      })
      expect(authorityMutation.status()).toBe(403)
    })

    await test.step('SUPER_ADMIN alone has no Process relationship or organizational authority', async () => {
      const adminApi = await roleApi(users.pjEvaluator)
      const processContextResponse = await adminApi.get(toApiUrl('/process-context/mine'))
      expect(processContextResponse.status()).toBe(200)
      const processContexts = unwrapApiData<ProcessRow[]>(await processContextResponse.json())
      expect(processContexts).toHaveLength(0)

      const authorityResponse = await adminApi.get(toApiUrl('/organizational-authority/mine'))
      expect(authorityResponse.status()).toBe(200)
      const authorities = unwrapApiData<AuthorityRow[]>(await authorityResponse.json())
      expect(authorities).toHaveLength(0)
    })

    await test.step('SUPER_ADMIN cannot author an unrelated Process SOP', async () => {
      const adminApi = await roleApi(users.pjEvaluator)
      const listResponse = await adminApi.get(toApiUrl('/process-admin/processes'))
      expect(listResponse.status()).toBe(200)
      const processes = unwrapApiData<ProcessRow[]>(await listResponse.json())
      const faculty = processes.find((row) => row.nama === 'Pengelolaan Akademik FTI')
      if (!faculty) throw new Error('Seeded Faculty Process tidak ditemukan')

      const fixture = sopFixture('J20-ADMIN')
      const createResponse = await adminApi.post(toApiUrl('/process-sop'), {
        data: {
          processId: faculty.processId,
          judul: fixture.title,
          nomorSop: fixture.number,
          namaLembaga: 'Fakultas Teknologi Informasi',
        },
      })
      expect(createResponse.status()).toBe(403)
    })
  })
})
