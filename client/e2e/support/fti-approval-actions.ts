import { expect, type Page } from '@playwright/test'

import { expectNoAppShellError, waitForAppReady } from './app'

export async function acceptProcessSopViaUi(
  page: Page,
  detailSopId: string,
): Promise<void> {
  await page.goto(`/penyusun/sop/${detailSopId}`)
  await waitForAppReady(page)

  await expect(page.getByText('Dokumen menunggu keputusan Anda sebagai Process Owner.')).toBeVisible()
  const accept = page.getByRole('button', { name: 'Terima', exact: true })
  await expect(accept).toBeVisible()
  await accept.click()

  const dialog = page.getByRole('dialog', { name: 'Terima SOP?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, terima', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  await expect(page.getByText('Siap untuk persetujuan', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expectNoAppShellError(page)
}

export async function openFinalApprovalFromNotification(
  page: Page,
  processName: string,
): Promise<void> {
  await page.goto('/work')
  await waitForAppReady(page)

  const bell = page.getByRole('button', { name: /notifikasi belum dibaca/i })
  await expect(bell).toBeVisible({ timeout: 15_000 })
  await bell.click()

  // Process notifications are sorted unread-first by the server. The journey
  // precondition marks prior notifications read and asserts exactly one fresh
  // matching unread notification through the API before this UI interaction.
  const notification = page
    .getByRole('link')
    .filter({ hasText: 'Persetujuan akhir SOP diperlukan' })
    .filter({
      hasText: `SOP pada Process ${processName} menunggu persetujuan akhir Anda.`,
    })
    .first()
  await expect(notification).toBeVisible()
  await notification.click()
  await page.waitForURL((url) => url.pathname === '/approval', { timeout: 15_000 })
  await waitForAppReady(page)
  await expectNoAppShellError(page)
}

export async function openFinalApprovalFromDeanNotification(
  page: Page,
  processName: string,
): Promise<void> {
  await openFinalApprovalFromNotification(page, processName)
}

export async function approveProcessSopViaUi(
  page: Page,
  title: string,
  authorityLabel: string,
): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Persetujuan Akhir' })).toBeVisible()
  const titleHeading = page.getByRole('heading', { name: title, exact: true })
  await expect(titleHeading).toBeVisible()

  const pendingRow = titleHeading.locator(
    'xpath=ancestor::div[.//button[normalize-space(.)="Setujui"]][1]',
  )
  await expect(pendingRow.getByText(authorityLabel, { exact: true })).toBeVisible()
  await expect(pendingRow.getByText('Menunggu persetujuan akhir', { exact: true })).toBeVisible()

  const approve = pendingRow.getByRole('button', { name: 'Setujui', exact: true })
  await expect(approve).toBeEnabled()
  await approve.click()

  const dialog = page.getByRole('dialog', { name: 'Setujui SOP ini?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, setujui', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  // Approval rerenders the row and removes the Setujui button. Reacquire the
  // post-transition row from its new stable action instead of reusing a locator
  // whose predicate describes the previous state.
  const approvedHeading = page.getByRole('heading', { name: title, exact: true })
  const approvedRow = approvedHeading.locator(
    'xpath=ancestor::div[.//button[normalize-space(.)="Tanda tangani"]][1]',
  )
  await expect(
    approvedRow.getByText('Persetujuan akhir tercatat · siap TTE', { exact: true }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(approvedRow.getByRole('button', { name: 'Tanda tangani', exact: true })).toBeVisible()
  await expectNoAppShellError(page)
}

export async function approveFacultyProcessSopViaUi(
  page: Page,
  title: string,
): Promise<void> {
  await approveProcessSopViaUi(page, title, 'Fakultas · Dekan')
}
