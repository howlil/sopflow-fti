import { expect, type Page } from '@playwright/test'

import { expectNoAppShellError, waitForAppReady } from './app'

export interface AdminAccountUiInput {
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
}

export async function createPlatformAccountViaAdminUi(
  page: Page,
  input: AdminAccountUiInput,
): Promise<void> {
  await page.goto('/admin/accounts')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Akun FTI', exact: true })).toBeVisible()

  await page.getByLabel('Nama', { exact: true }).fill(input.nama)
  await page.getByLabel('NIP', { exact: true }).fill(input.nip)
  await page.getByLabel('Email', { exact: true }).fill(input.email)
  await page.getByLabel('Jabatan', { exact: true }).fill(input.jabatan)
  await page.getByLabel('Pangkat', { exact: true }).fill(input.pangkat)
  await page.getByLabel('Nomor HP', { exact: true }).fill(input.nohp)
  await page.getByRole('button', { name: 'Buat Akun', exact: true }).click()

  await expect(page.getByText(input.nama, { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(new RegExp(input.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeVisible()
  await expectNoAppShellError(page)
}

export interface AdminProcessUiInput {
  departmentName: string
  processName: string
  ownerLabel: string
  memberLabels: string[]
}

export async function createDepartmentProcessViaAdminUi(
  page: Page,
  input: AdminProcessUiInput,
): Promise<void> {
  await page.goto('/admin/processes')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Process FTI', exact: true })).toBeVisible()

  const departmentInput = page.getByPlaceholder('Nama departemen')
  await departmentInput.fill(input.departmentName)
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()
  await expect(page.getByText(input.departmentName, { exact: true })).toBeVisible({ timeout: 15_000 })

  await page.getByLabel('Nama Process').fill(input.processName)
  await page.getByLabel('Scope').selectOption('DEPARTMENT')
  await page.getByLabel('Departemen').selectOption({ label: input.departmentName })
  const ownerSelect = page
    .locator('label')
    .filter({ has: page.locator('select') })
    .filter({ hasText: 'Process Owner' })
    .locator('select')
  await ownerSelect.selectOption({ label: input.ownerLabel })

  await expect(
    page.getByRole('checkbox', { name: input.ownerLabel, exact: true }),
    'Process Owner tidak boleh ditawarkan lagi sebagai Member',
  ).toHaveCount(0)

  for (const memberLabel of input.memberLabels) {
    await page.getByRole('checkbox', { name: memberLabel, exact: true }).check()
  }

  await page.getByRole('button', { name: 'Buat Process', exact: true }).click()

  const processHeading = page.getByRole('heading', { name: input.processName, exact: true })
  await expect(processHeading).toBeVisible({ timeout: 15_000 })
  const row = processHeading.locator('xpath=ancestor::div[.//button[normalize-space(.)="Edit"]][1]')
  await expect(row).toContainText(input.departmentName)
  await expect(row).toContainText(`${input.memberLabels.length} member`)
  await expectNoAppShellError(page)
}

export async function assignDeanViaAdminUi(
  page: Page,
  holderLabel: string,
): Promise<void> {
  await page.goto('/admin/authorities')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Authority FTI', exact: true })).toBeVisible()

  const select = page.getByLabel('Dean aktif')
  await select.selectOption({ label: holderLabel })
  await expect(select.locator('option:checked')).toHaveText(holderLabel, { timeout: 15_000 })
  await expectNoAppShellError(page)
}

export async function assignDepartmentHeadViaAdminUi(
  page: Page,
  departmentName: string,
  holderLabel: string,
): Promise<void> {
  await page.goto('/admin/authorities')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Authority FTI', exact: true })).toBeVisible()

  const select = page.getByLabel(`Kepala Departemen ${departmentName}`)
  await select.selectOption({ label: holderLabel })
  await expect(select.locator('option:checked')).toHaveText(holderLabel, { timeout: 15_000 })
  await expectNoAppShellError(page)
}
