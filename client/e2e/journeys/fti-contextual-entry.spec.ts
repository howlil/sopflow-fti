import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'

async function expectNoLegacyWorkflowEntry(page: Awaited<ReturnType<Parameters<typeof test>[0]>> extends never ? never : never) {
  void page
}

test.describe('FTI contextual entry', () => {
  test('Process Owner masuk ke beranda kerja dengan capability Process tanpa menu workflow legacy', async ({ roleSession }) => {
    const { page } = await roleSession(targetUsers.processOwner)

    await page.goto('/work')

    await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
    await expect(page.getByText('2 Process sebagai Owner · 0 sebagai Member.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Pelaksana SOP', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Peraturan', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
  })

  test('Process Member mendapat pekerjaan Process tanpa authority approval', async ({ roleSession }) => {
    const { page } = await roleSession(targetUsers.processMember)

    await page.goto('/work')

    await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
    await expect(page.getByText('0 Process sebagai Owner · 1 sebagai Member.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
  })

  test('Dekan mendapat contextual approval tanpa Process authoring capability', async ({ roleSession }) => {
    const { page } = await roleSession(targetUsers.dean)

    await page.goto('/work')

    await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
    await expect(page.getByText('1 kewenangan organisasi aktif.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
  })

  test('Kepala Departemen mendapat contextual approval tanpa Process authoring capability', async ({ roleSession }) => {
    const { page } = await roleSession(targetUsers.headOfDepartment)

    await page.goto('/work')

    await expect(page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
    await expect(page.getByText('1 kewenangan organisasi aktif.', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'SOP', exact: true })).toHaveCount(0)
  })
})
