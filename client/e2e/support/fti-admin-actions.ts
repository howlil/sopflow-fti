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
  await expect(
    page.locator('#main-content').getByRole('heading', { name: 'Akun FTI', exact: true }),
  ).toBeVisible()

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

export async function createDepartemenViaAdminUi(
  page: Page,
  namaDepartemen: string,
): Promise<void> {
  await page.goto('/admin/proses-bisnis')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Governance Proses Bisnis', exact: true })).toBeVisible()

  const departmentInput = page.getByPlaceholder('Nama jurusan')
  await departmentInput.fill(namaDepartemen)
  await page.getByRole('button', { name: 'Tambah', exact: true }).click()
  await expect(page.getByText(namaDepartemen, { exact: true })).toBeVisible({ timeout: 15_000 })
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

export async function assignDepartemenHeadViaAdminUi(
  page: Page,
  namaDepartemen: string,
  holderLabel: string,
): Promise<void> {
  await page.goto('/admin/authorities')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: 'Authority FTI', exact: true })).toBeVisible()

  const select = page.getByLabel(`Kepala Departemen ${namaDepartemen}`)
  await select.selectOption({ label: holderLabel })
  await expect(select.locator('option:checked')).toHaveText(holderLabel, { timeout: 15_000 })
  await expectNoAppShellError(page)
}
