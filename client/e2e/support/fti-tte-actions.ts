import { expect, type Page } from '@playwright/test'

import { expectNoAppShellError, searchPageIfAvailable, waitForAppReady } from './app'
import { e2ePin } from './test-data'

export async function signProcessSopViaUi(
  page: Page,
  title: string,
): Promise<void> {
  await page.goto('/approval')
  await waitForAppReady(page)

  const titleHeading = page.getByRole('heading', { name: title, exact: true })
  await expect(titleHeading).toBeVisible()

  // Critical journeys intentionally share one runtime database in CI. Scope signing
  // assertions to the row containing this unique SOP title.
  const row = titleHeading.locator(
    'xpath=ancestor::div[.//button[normalize-space(.)="Tanda tangani"]][1]',
  )
  await expect(row.getByText('Persetujuan akhir tercatat · siap TTE', { exact: true })).toBeVisible()

  const sign = row.getByRole('button', { name: 'Tanda tangani', exact: true })
  await expect(sign).toBeEnabled()
  await sign.click()

  const dialog = page.getByRole('dialog', { name: 'Tanda Tangan SOP — PIN TTE' })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await dialog.getByPlaceholder(/masukkan pin/i).fill(e2ePin)
  await dialog.getByRole('button', { name: 'Tanda Tangani', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 45_000 })

  await expect(titleHeading).toHaveCount(0, { timeout: 15_000 })
  await expectNoAppShellError(page)
}

export async function signFacultyProcessSopViaUi(
  page: Page,
  title: string,
): Promise<void> {
  await signProcessSopViaUi(page, title)
}

export async function expectProcessSopBerlakuInWorkQueue(
  page: Page,
  title: string,
): Promise<void> {
  await page.goto('/work/queue')
  await waitForAppReady(page)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText('Berlaku', { exact: true })).toBeVisible()
  await expectNoAppShellError(page)
}

export async function expectProcessSopInPublicArchive(
  page: Page,
  title: string,
): Promise<void> {
  await page.goto('/arsip')
  await waitForAppReady(page)
  await searchPageIfAvailable(page, title)
  const item = page.locator('[data-arsip-sop-id]').filter({ hasText: title }).first()
  await expect(item).toBeVisible({ timeout: 15_000 })
  await item.click()
  await expect(page.locator('body')).toContainText(/pratinjau|dokumen|sop/i)
  await expect(page.locator('body')).not.toContainText(/catatan evaluator|nilai opd|internal evaluasi/i)
  await expectNoAppShellError(page)
}
