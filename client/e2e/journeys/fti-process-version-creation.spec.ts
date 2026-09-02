import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import {
  getProcessVersionHistory,
  seedPublishedProcessSop,
} from '../support/fti-version-preconditions'

test.describe('End-to-End Business Journey — Process version creation', () => {
  test('J16 Contextual Version Creation — Process relationship owns version creation and concurrency', async ({
    roleApi,
    roleSession,
  }) => {
    const v1 = await seedPublishedProcessSop(roleApi, 'J16-VERSION', {
      actor: targetUsers.processMember,
    })

    await test.step('Process Member membuat V2 dari V1 BERLAKU melalui existing version UI', async () => {
      const member = await roleSession(targetUsers.processMember)
      await member.page.goto(`/penyusun/sop/${v1.detailSopId}`)
      await waitForAppReady(member.page)
      await member.page.locator('button[title="Versi"]').click()
      const v1Row = member.page.getByTestId('sop-version-row-1')
      await expect(v1Row).toContainText(/berlaku/i)
      await v1Row.getByRole('button', { name: /buat versi baru dari versi 1/i }).click()
      const dialog = member.page.getByRole('dialog', { name: /buat versi baru/i })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: /^buat versi baru$/i }).click()
      await expect.poll(() => new URL(member.page.url()).pathname).not.toContain(v1.detailSopId)
      await expectNoAppShellError(member.page)
    })

    await test.step('V1 tetap BERLAKU dan tepat satu V2 DRAFT menyimpan lineage', async () => {
      const history = await getProcessVersionHistory(roleApi, targetUsers.processMember, v1.sopId)
      expect(history).toHaveLength(2)
      expect(history[0]).toMatchObject({
        detailSopId: v1.detailSopId,
        versi: 1,
        status: 'BERLAKU',
      })
      expect(history[1]).toMatchObject({
        versi: 2,
        status: 'DRAFT',
        revisiDariDetailSopId: v1.detailSopId,
      })
    })

    await test.step('Actor tanpa Process relationship tidak dapat membuat versi target', async () => {
      for (const deniedUser of [targetUsers.dean, targetUsers.departmentMember, users.pjEvaluator]) {
        const api = await roleApi(deniedUser)
        const response = await api.post(toApiUrl(`/process-sop/${v1.detailSopId}/version`))
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Dua request serentak pada SOP lain tetap menghasilkan satu DRAFT', async () => {
      const raceV1 = await seedPublishedProcessSop(roleApi, 'J16-RACE', {
        actor: targetUsers.processMember,
      })
      const memberApi = await roleApi(targetUsers.processMember)
      const ownerApi = await roleApi(targetUsers.processOwner)
      const endpoint = toApiUrl(`/process-sop/${raceV1.detailSopId}/version`)
      const responses = await Promise.all([memberApi.post(endpoint), ownerApi.post(endpoint)])
      expect(responses.map((response) => response.status()).sort()).toEqual([201, 409])

      const history = await getProcessVersionHistory(
        roleApi,
        targetUsers.processMember,
        raceV1.sopId,
      )
      expect(history.filter((row) => row.versi === 2 && row.status === 'DRAFT')).toHaveLength(1)
    })
  })
})
