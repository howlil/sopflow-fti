import { expect, type Locator, type Page } from '@playwright/test'

import { waitForAppReady } from './app'

async function selectUserByEmail(select: Locator, email: string): Promise<void> {
  const option = select.locator('option').filter({ hasText: email }).first()
  await expect(option, `option user ${email}`).toHaveCount(1)
  const value = await option.getAttribute('value')
  if (!value) throw new Error(`User option tidak memiliki value: ${email}`)
  await select.selectOption(value)
}

export async function openProcessAdministration(page: Page): Promise<void> {
  await page.goto('/admin/processes')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Process FTI' })).toBeVisible()
}

export async function createDepartmentViaAdminUi(
  page: Page,
  departmentName: string,
): Promise<void> {
  await openProcessAdministration(page)
  const input = page.getByPlaceholder('Nama departemen')
  await input.fill(departmentName)
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()
  await expect(page.getByText(departmentName, { exact: true })).toBeVisible({ timeout: 15_000 })
}

export async function createDepartmentProcessViaAdminUi(
  page: Page,
  params: {
    processName: string
    departmentName: string
    ownerEmail: string
    memberEmails: string[]
  },
): Promise<void> {
  await openProcessAdministration(page)
  await page.getByLabel('Nama Process', { exact: true }).fill(params.processName)
  await page.getByLabel('Scope', { exact: true }).selectOption('DEPARTMENT')
  await page.getByLabel('Departemen', { exact: true }).selectOption({ label: params.departmentName })
  await selectUserByEmail(page.getByLabel('Process Owner', { exact: true }), params.ownerEmail)

  for (const email of params.memberEmails) {
    const memberLabel = page.locator('label').filter({ hasText: email }).first()
    const checkbox = memberLabel.getByRole('checkbox')
    await expect(checkbox, `member checkbox ${email}`).toBeVisible()
    await checkbox.check()
  }

  await page.getByRole('button', { name: 'Buat Process', exact: true }).click()
  await expect(page.getByRole('heading', { name: params.processName, exact: true })).toBeVisible({
    timeout: 15_000,
  })
}

export async function renameProcessViaAdminUi(
  page: Page,
  currentName: string,
  nextName: string,
): Promise<void> {
  await openProcessAdministration(page)
  const heading = page.getByRole('heading', { name: currentName, exact: true })
  const row = heading.locator('xpath=ancestor::div[.//button[normalize-space(.)="Edit"]][1]')
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  const nameInput = page.getByLabel('Nama Process', { exact: true })
  await expect(nameInput).toHaveValue(currentName)
  await nameInput.fill(nextName)
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click()
  await expect(page.getByRole('heading', { name: nextName, exact: true })).toBeVisible({
    timeout: 15_000,
  })
}

export async function openAuthorityAdministration(page: Page): Promise<void> {
  await page.goto('/admin/authorities')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Authority FTI' })).toBeVisible()
}

export async function assignDepartmentHeadViaAdminUi(
  page: Page,
  departmentName: string,
  holderEmail: string,
): Promise<void> {
  await openAuthorityAdministration(page)
  const select = page.getByLabel(`Kepala Departemen ${departmentName}`, { exact: true })
  await selectUserByEmail(select, holderEmail)
  await expect(select.locator('option:checked')).toContainText(holderEmail, { timeout: 15_000 })
}

export async function assignDeanViaAdminUi(page: Page, holderEmail: string): Promise<void> {
  await openAuthorityAdministration(page)
  const select = page.getByLabel('Dean aktif', { exact: true })
  await selectUserByEmail(select, holderEmail)
  await expect(select.locator('option:checked')).toContainText(holderEmail, { timeout: 15_000 })
}
