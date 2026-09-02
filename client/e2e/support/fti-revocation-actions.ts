import { expect, type Page } from '@playwright/test'

import {
  expectNoAppShellError,
  searchPageIfAvailable,
  waitForAppReady,
} from './app'

export async function revokeProcessSopViaUi(
  page: Page,
  title: string,
  authorityLabel: string,
): Promise<void> {
  await page.goto('/approval')
  await waitForAppReady(page)

  const titleHeading = page.getByRole('heading', { name: title, exact: true })
  await expect(titleHeading).toBeVisible()
  const row = titleHeading.locator(
    'xpath=ancestor::div[.//button[normalize-space(.)="Cabut SOP"]][1]',
  )
  await expect(row.getByText(authorityLabel, { exact: true })).toBeVisible()
  await expect(row.getByText('Berlaku', { exact: true })).toBeVisible()

  await row.getByRole('button', { name: 'Cabut SOP', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cabut SOP ini?' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('tidak lagi berlaku setelah dicabut')
  await dialog.getByRole('button', { name: 'Ya, cabut SOP', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  await expect(titleHeading).toHaveCount(0, { timeout: 15_000 })
  await expectNoAppShellError(page)
}

export async function expectProcessSopAbsentFromPublicArchive(
  page: Page,
  title: string,
): Promise<void> {
  await page.goto('/arsip')
  await waitForAppReady(page)
  await searchPageIfAvailable(page, title)
  await expect(page.locator('[data-arsip-sop-id]').filter({ hasText: title })).toHaveCount(0)
  await expectNoAppShellError(page)
}
