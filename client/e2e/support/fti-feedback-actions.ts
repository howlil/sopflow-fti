import { expect, type APIRequestContext, type Page } from '@playwright/test'

import { apiGet, apiPost } from './api'
import { expectNoAppShellError, waitForAppReady } from './app'

export type ProsesBisnisFeedbackKind =
  | 'PROCESS_REVISION_REQUESTED'
  | 'PROCESS_SOP_EFFECTIVE'
  | 'PROCESS_SOP_REVOKED'

export interface ProsesBisnisFeedbackNotification {
  notifikasiProsesBisnisId: string
  kind: string
  title: string
  preview: string
  body: string
  actionHref: string
  readAt: string | null
  createdAt: string
}

export async function markAllNotifikasiProsesBisnissRead(api: APIRequestContext): Promise<void> {
  await apiPost(api, '/notifications/process/read-all')
}

export async function requestProsesBisnisRevisionViaApi(
  ownerApi: APIRequestContext,
  detailSopId: string,
  catatan?: string,
): Promise<void> {
  await apiPost(ownerApi, `/sop-proses-bisnis/${detailSopId}/review`, {
    decision: 'REVISION',
    ...(catatan !== undefined ? { catatan } : {}),
  })
}

export async function findProsesBisnisFeedback(
  api: APIRequestContext,
  kind: ProsesBisnisFeedbackKind,
): Promise<ProsesBisnisFeedbackNotification[]> {
  const notifications = await apiGet<ProsesBisnisFeedbackNotification[]>(api, '/notifications/process?limit=50')
  return notifications.filter((item) => item.kind === kind)
}

export async function expectSingleProsesBisnisFeedback(
  api: APIRequestContext,
  kind: ProsesBisnisFeedbackKind,
  expected: {
    title: string
    preview: string
    actionHref?: string
  },
): Promise<ProsesBisnisFeedbackNotification> {
  const matches = await findProsesBisnisFeedback(api, kind)
  expect(matches).toHaveLength(1)
  const item = matches[0]
  expect(item).toEqual(
    expect.objectContaining({
      kind,
      title: expected.title,
      preview: expected.preview,
      actionHref: expected.actionHref ?? '/work/queue',
    }),
  )
  return item
}

export async function openProsesBisnisFeedbackFromNotification(
  page: Page,
  expected: { title: string; preview: string },
  notifikasiProsesBisnisId?: string,
): Promise<void> {
  await page.goto('/work')
  await waitForAppReady(page)

  const bell = page.getByRole('button', { name: /notifikasi/i }).first()
  await expect(bell).toBeVisible({ timeout: 15_000 })
  await bell.click()

  const notification = notifikasiProsesBisnisId
    ? page.locator(`[data-process-notification-id="${notifikasiProsesBisnisId}"]`)
    : page
        .getByRole('link')
        .filter({ hasText: expected.title })
        .filter({ hasText: expected.preview })
        .filter({ has: page.locator('.bg-primary') })
        .first()
  await expect(notification).toBeVisible({ timeout: 15_000 })
  await expect(notification).toContainText(expected.title)
  await expect(notification).toContainText(expected.preview)

  const readResponsePromise = notifikasiProsesBisnisId
    ? page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes(
            `/notifications/process/items/${encodeURIComponent(notifikasiProsesBisnisId)}/read`,
          ),
        { timeout: 15_000 },
      )
    : null

  await notification.click()

  if (readResponsePromise) {
    const readResponse = await readResponsePromise
    expect(
      readResponse.ok(),
      `ProsesBisnis notification read request failed with HTTP ${readResponse.status()}`,
    ).toBe(true)
  }

  await page.waitForURL((url) => url.pathname === '/work/queue', { timeout: 15_000 })
  await waitForAppReady(page)
  await expectNoAppShellError(page)
}
