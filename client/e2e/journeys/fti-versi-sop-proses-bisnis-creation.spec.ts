import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import {
  getProsesBisnisVersionHistory,
  seedPublishedProsesBisnisSop,
} from '../support/fti-version-preconditions'

test.describe('End-to-End Business Journey — Proses Bisnis version creation', () => {
  test('J16 Contextual Version Creation — Proses Bisnis relationship owns version creation and concurrency', async ({
    roleApi,
    roleSession,
  }) => {
    const v1 = await seedPublishedProsesBisnisSop(roleApi, 'J16-VERSION', {
      actor: targetUsers.anggotaProsesBisnis,
    })

    await test.step('Anggota Proses Bisnis membuat V2 dari V1 BERLAKU melalui existing version UI', async () => {
      const anggota = await roleSession(targetUsers.anggotaProsesBisnis)
      await anggota.page.goto(`/penyusun/sop/${v1.detailSopId}`)
      await waitForAppReady(anggota.page)
      await anggota.page.locator('button[title="Versi"]').click()
      const v1Row = anggota.page.getByTestId('sop-version-row-1')
      await expect(v1Row).toContainText(/berlaku/i)
      await v1Row.getByRole('button', { name: /buat versi baru dari versi 1/i }).click()
      const dialog = anggota.page.getByRole('dialog', { name: /buat versi baru/i })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: /^buat versi baru$/i }).click()
      await expect.poll(() => new URL(anggota.page.url()).pathname).not.toContain(v1.detailSopId)
      await expectNoAppShellError(anggota.page)
    })

    await test.step('V1 tetap BERLAKU dan tepat satu V2 DRAFT menyimpan lineage', async () => {
      const history = await getProsesBisnisVersionHistory(roleApi, targetUsers.anggotaProsesBisnis, v1.sopId)
      expect(history).toHaveLength(2)
      expect(history[0]).toMatchObject({
        detailSopId: v1.detailSopId,
        versi: 1,
        status: 'EFFECTIVE',
      })
      expect(history[1]).toMatchObject({
        versi: 2,
        status: 'DRAFT',
        revisiDariDetailSopId: v1.detailSopId,
      })
    })

    await test.step('Actor tanpa Proses Bisnis relationship tidak dapat membuat versi target', async () => {
      for (const deniedUser of [targetUsers.dean, targetUsers.departmentMember, targetUsers.admin]) {
        const api = await roleApi(deniedUser)
        const response = await api.post(toApiUrl(`/sop-proses-bisnis/${v1.detailSopId}/version`))
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Dua request serentak pada SOP lain tetap menghasilkan satu DRAFT', async () => {
      const raceV1 = await seedPublishedProsesBisnisSop(roleApi, 'J16-RACE', {
        actor: targetUsers.anggotaProsesBisnis,
      })
      const memberApi = await roleApi(targetUsers.anggotaProsesBisnis)
      const ownerApi = await roleApi(targetUsers.penanggungJawabProsesBisnis)
      const endpoint = toApiUrl(`/sop-proses-bisnis/${raceV1.detailSopId}/version`)
      const responses = await Promise.all([memberApi.post(endpoint), ownerApi.post(endpoint)])
      expect(responses.map((response) => response.status()).sort()).toEqual([201, 409])

      const history = await getProsesBisnisVersionHistory(
        roleApi,
        targetUsers.anggotaProsesBisnis,
        raceV1.sopId,
      )
      expect(history.filter((row) => row.versi === 2 && row.status === 'DRAFT')).toHaveLength(1)
    })
  })
})
