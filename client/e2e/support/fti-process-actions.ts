import { expect, type Page } from '@playwright/test'

import { expectNoAppShellError, waitForAppReady } from './app'

async function expectWorkQueueRow(
  page: Page,
  params: {
    title: string
    statusLabel: string
    actionLabel: string
  },
): Promise<void> {
  await page.goto('/work/queue')
  await waitForAppReady(page)

  await expect(page.getByRole('heading', { name: 'Pekerjaan SOP' })).toBeVisible()
  const titleHeading = page.getByRole('heading', { name: params.title, exact: true })
  await expect(titleHeading).toBeVisible()

  // Multiple target journeys intentionally share one runtime database in CI.
  // Lingkup status/action assertions to the card identified by this unique SOP title.
  const row = titleHeading.locator(
    `xpath=ancestor::div[.//a[normalize-space(.)="${params.actionLabel}"]][1]`,
  )
  await expect(row.getByText(params.statusLabel, { exact: true })).toBeVisible()
  await expect(row.getByRole('link', { name: params.actionLabel, exact: true })).toBeVisible()
  await expectNoAppShellError(page)
}

export async function expectProsesBisnisDraftInMemberQueue(
  page: Page,
  title: string,
): Promise<void> {
  await expectWorkQueueRow(page, {
    title,
    statusLabel: 'Draft',
    actionLabel: 'Lanjutkan SOP',
  })
}

export async function submitProsesBisnisSopForReviewViaUi(
  page: Page,
  detailSopId: string,
): Promise<void> {
  await page.goto(`/penyusun/sop/${detailSopId}`)
  await waitForAppReady(page)

  const submit = page.getByRole('button', { name: 'Kirim untuk review', exact: true })
  await expect(submit).toBeEnabled()
  await submit.click()

  const dialog = page.getByRole('dialog', { name: /Kirim (SOP|revisi) untuk review\?/i })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, kirim untuk review', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  await expect(page.getByText('Review Penanggung Jawab Proses Bisnis', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByText('Dokumen sedang direview oleh Penanggung Jawab Proses Bisnis dan untuk sementara bersifat read-only.'),
  ).toBeVisible()
  await expectNoAppShellError(page)
}

export async function expectPemeriksaanProsesBisnisInOwnerQueue(
  page: Page,
  title: string,
): Promise<void> {
  await expectWorkQueueRow(page, {
    title,
    statusLabel: 'Menunggu review Penanggung Jawab Proses Bisnis',
    actionLabel: 'Review SOP',
  })
}

export async function requestProsesBisnisRevisionViaUi(
  page: Page,
  detailSopId: string,
): Promise<void> {
  await page.goto(`/penyusun/sop/${detailSopId}`)
  await waitForAppReady(page)

  await expect(page.getByText('Dokumen menunggu keputusan Anda sebagai Penanggung Jawab Proses Bisnis.')).toBeVisible()
  const revision = page.getByRole('button', { name: 'Minta revisi', exact: true })
  await expect(revision).toBeVisible()
  await revision.click()

  const dialog = page.getByRole('dialog', { name: 'Kembalikan untuk revisi?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, minta revisi', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })

  await expect(page.getByText('Perlu revisi', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('SOP dikembalikan oleh Penanggung Jawab Proses Bisnis.', { exact: false })).toBeVisible()
  await expectNoAppShellError(page)
}

export async function expectProsesBisnisRevisionInMemberQueue(
  page: Page,
  title: string,
): Promise<void> {
  await expectWorkQueueRow(page, {
    title,
    statusLabel: 'Perlu revisi',
    actionLabel: 'Perbaiki SOP',
  })
}
