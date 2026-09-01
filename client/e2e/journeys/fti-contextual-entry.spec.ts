import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { expectNoAppShellError, waitForAppReady } from '../support/app'

test.describe('End-to-End Business Journey — FTI contextual entry', () => {
  test('J08 FTI Contextual Entry — capability mengikuti Process dan kewenangan organisasi', async ({
    roleSession,
  }) => {
    await test.step('Process Owner melihat pekerjaan Process tanpa workflow legacy sebagai jalur utama', async () => {
      const { page } = await roleSession(targetUsers.processOwner)

      await page.goto('/work')
      await waitForAppReady(page)

      await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
      await expect(
        page.getByText('3 Process sebagai Owner · 0 sebagai Member.', { exact: false }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'Pelaksana SOP', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Peraturan', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
      await expectNoAppShellError(page)
    })

    await test.step('Process Member melihat pekerjaan Process tanpa authority approval', async () => {
      const { page } = await roleSession(targetUsers.processMember)

      await page.goto('/work')
      await waitForAppReady(page)

      await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
      await expect(
        page.getByText('0 Process sebagai Owner · 1 sebagai Member.', { exact: false }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
      await expectNoAppShellError(page)
    })

    await test.step('Dekan melihat persetujuan contextual tanpa capability authoring Process', async () => {
      const { page } = await roleSession(targetUsers.dean)

      await page.goto('/work')
      await waitForAppReady(page)

      await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
      await expect(page.getByText('1 kewenangan organisasi aktif.', { exact: false })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
      await expectNoAppShellError(page)
    })

    await test.step('Kepala Departemen melihat persetujuan contextual tanpa capability authoring Process', async () => {
      const { page } = await roleSession(targetUsers.headOfDepartment)

      await page.goto('/work')
      await waitForAppReady(page)

      await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
      await expect(page.getByText('1 kewenangan organisasi aktif.', { exact: false })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
      await expectNoAppShellError(page)
    })
  })
})
