import { expect, type APIRequestContext, type Page } from '@playwright/test'

import { apiGet, apiPost } from './api'
import { expectNoAppShellError, waitForAppReady } from './app'

export type ProcessFeedbackKind =
  | 'PROCESS_REVISION_REQUESTED'
  | 'PROCESS_SOP_EFFECTIVE'
  | 'PROCESS_SOP_REVOKED'

export interface ProcessFeedbackNotification {
  processNotificationId: string
  kind: string
  title: string
  preview: string
  body: string
  actionHref: string
  readAt: string | null
  createdAt: string
}

export async function markAllProcessNotificationsRead(api: APIRequestContext): Promise<void> {
  await apiPost(api, '/notifications/process/read-all')
}

export async function requestProcessRevisionViaApi(
  ownerApi: APIRequestContext,
  detailSopId: string,
): Promise<void> {
  await apiPost(ownerApi, `/process-sop/${detailSopId}/review`, { decision: 'REVISION' })
}

export async function findProcessFeedback(
  api: APIRequestContext,
  kind: ProcessFeedbackKind,
): Promise<ProcessFeedbackNotification[]> {
  const notifications = await apiGet<ProcessFeedbackNotification[]>(api, '/notifications/process?limit=50')
  return notifications.filter((item) => item.kind === kind)
}

export async function expectSingleProcessFeedback(
  api: APIRequestContext,
  kind: ProcessFeedbackKind,
  expected: {
    title: string
    preview: string
    actionHref?: string
  },
): Promise<ProcessFeedbackNotification> {
  const matches = await findProcessFeedback(api, kind)
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

export async function openProcessFeedbackFromNotification(
  page: Page,
  expected: { title: string; preview: string },
  processNotificationId?: string,
): Promise<void> {
  await page.goto('/work')
  await waitForAppReady(page)

  const bell = page.getByRole('button', { name: /notifikasi/i }).first()
  await expect(bell).toBeVisible({ timeout: 15_000 })
  await bell.click()

  const notification = processNotificationId
    ? page.locator(`[data-process-notification-id="${processNotificationId}"]`)
    : page
        .getByRole('link')
        .filter({ hasText: expected.title })
        .filter({ hasText: expected.preview })
        .filter({ has: page.locator('.bg-primary') })
        .first()
  await expect(notification).toBeVisible({ timeout: 15_000 })
  await expect(notification).toContainText(expected.title)
  await expect(notification).toContainText(expected.preview)

  const readResponsePromise = processNotificationId
    ? page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().includes(
            `/notifications/process/items/${encodeURIComponent(processNotificationId)}/read`,
          ),
        { timeout: 15_000 },
      )
    : null

  await notification.click()

  if (readResponsePromise) {
    const readResponse = await readResponsePromise
    expect(
      readResponse.ok(),
      `Process notification read request failed with HTTP ${readResponse.status()}`,
    ).toBe(true)
  }

  await page.waitForURL((url) => url.pathname === '/work/queue', { timeout: 15_000 })
  await waitForAppReady(page)
  await expectNoAppShellError(page)
}
