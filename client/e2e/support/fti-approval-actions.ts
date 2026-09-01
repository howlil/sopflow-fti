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

export async function openFinalApprovalFromDeanNotification(
  page: Page,
  processName: string,
): Promise<void> {
  await page.goto('/work')
  await waitForAppReady(page)

  const bell = page.getByRole('button', { name: /notifikasi belum dibaca/i })
  await expect(bell).toBeVisible({ timeout: 15_000 })
  await bell.click()

  const notification = page.getByRole('link').filter({
    hasText: 'Persetujuan akhir SOP diperlukan',
  })
  await expect(notification).toBeVisible()
  await expect(notification).toContainText(
    `SOP pada Process ${processName} menunggu persetujuan akhir Anda.`,
  )
  await notification.click()
  await page.waitForURL((url) => url.pathname === '/approval', { timeout: 15_000 })
  await waitForAppReady(page)
  await expectNoAppShellError(page)
}

export async function approveFacultyProcessSopViaUi(
  page: Page,
  title: string,
): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Persetujuan Akhir' })).toBeVisible()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText('Fakultas · Dekan', { exact: true })).toBeVisible()
  await expect(page.getByText('Menunggu persetujuan akhir', { exact: true })).toBeVisible()

  const approve = page.getByRole('button', { name: 'Setujui', exact: true })
  await expect(approve).toBeEnabled()
  await approve.click()

  const dialog = page.getByRole('dialog', { name: 'Setujui SOP ini?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, setujui', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  await expect(page.getByText('Persetujuan akhir tercatat · siap TTE', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'Tanda tangani', exact: true })).toBeVisible()
  await expectNoAppShellError(page)
}
