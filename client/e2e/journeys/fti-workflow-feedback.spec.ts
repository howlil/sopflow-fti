import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { apiGet } from '../support/api'
import {
  expectSingleProcessFeedback,
  findProcessFeedback,
  markAllProcessNotificationsRead,
  openProcessFeedbackFromNotification,
  requestProcessRevisionViaApi,
} from '../support/fti-feedback-actions'
import { seedProcessSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'
import { revokeProcessSopViaApi } from '../support/fti-revocation-actions'
import { seedEffectiveProcessSop } from '../support/fti-revocation-preconditions'

const processName = 'Layanan Fakultas Teknologi Informasi'

test.describe('End-to-End Business Journey — Process workflow feedback closure', () => {
  test('J31 Revision Feedback — author menerima outcome revisi dari Process Owner', async ({
    roleApi,
  }) => {
    const sop = await seedProcessSopAwaitingOwnerReview(roleApi, 'J31-REVISION', {
      actor: targetUsers.processMember,
      processName,
    })
    const authorApi = await roleApi(targetUsers.processMember)
    const ownerApi = await roleApi(targetUsers.processOwner)
    await markAllProcessNotificationsRead(authorApi)
    await markAllProcessNotificationsRead(ownerApi)

    await test.step('Process Owner mengembalikan SOP untuk revisi', async () => {
      await requestProcessRevisionViaApi(ownerApi, sop.detailSopId)
    })

    await test.step('Author menerima target-native revision feedback dan Process Owner tidak menerima copy sendiri', async () => {
      await expectSingleProcessFeedback(authorApi, 'PROCESS_REVISION_REQUESTED', {
        title: 'Revisi SOP Process diperlukan',
        preview: `SOP pada Process ${sop.processName} dikembalikan untuk revisi.`,
      })
      expect(await findProcessFeedback(ownerApi, 'PROCESS_REVISION_REQUESTED')).toHaveLength(0)
    })
  })

  test('J32 Effective SOP Outcome — author dan Process Owner mengetahui SOP sudah berlaku', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J32-EFFECTIVE',
      { actor: targetUsers.processMember, processName },
      targetUsers.dean,
      'Fakultas · Dekan',
    )

    await test.step('Author dan Process Owner masing-masing menerima satu effective feedback', async () => {
      for (const recipient of [targetUsers.processMember, targetUsers.processOwner]) {
        await expectSingleProcessFeedback(
          await roleApi(recipient),
          'PROCESS_SOP_EFFECTIVE',
          {
            title: 'SOP Process sudah berlaku',
            preview: `SOP pada Process ${sop.processName} sudah efektif dan dipublikasikan.`,
          },
        )
      }
    })
  })

  test('J33 Revocation Feedback — author dan Process Owner mengetahui SOP sudah tidak berlaku', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J33-REVOKED',
      { actor: targetUsers.processMember, processName },
      targetUsers.dean,
      'Fakultas · Dekan',
    )
    const authorApi = await roleApi(targetUsers.processMember)
    const ownerApi = await roleApi(targetUsers.processOwner)
    await markAllProcessNotificationsRead(authorApi)
    await markAllProcessNotificationsRead(ownerApi)

    await test.step('Contextual authority mencabut SOP yang berlaku', async () => {
      await revokeProcessSopViaApi(await roleApi(targetUsers.dean), sop.detailSopId)
    })

    await test.step('Author dan Process Owner masing-masing menerima revocation feedback', async () => {
      for (const api of [authorApi, ownerApi]) {
        await expectSingleProcessFeedback(api, 'PROCESS_SOP_REVOKED', {
          title: 'SOP Process sudah dicabut',
          preview: `SOP pada Process ${sop.processName} sudah tidak berlaku.`,
        })
      }
    })
  })

  test('J34 Action & Inbox Integrity — feedback membuka work queue dan menjadi terbaca', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProcessSopAwaitingOwnerReview(roleApi, 'J34-INBOX', {
      actor: targetUsers.processMember,
      processName,
    })
    const authorApi = await roleApi(targetUsers.processMember)
    await markAllProcessNotificationsRead(authorApi)
    await requestProcessRevisionViaApi(await roleApi(targetUsers.processOwner), sop.detailSopId)

    const expected = {
      title: 'Revisi SOP Process diperlukan',
      preview: `SOP pada Process ${sop.processName} dikembalikan untuk revisi.`,
    }
    await expectSingleProcessFeedback(authorApi, 'PROCESS_REVISION_REQUESTED', expected)

    await test.step('Author membuka notification dan diarahkan ke target FTI-native work queue', async () => {
      const author = await roleSession(targetUsers.processMember)
      await openProcessFeedbackFromNotification(author.page, expected)
    })

    await test.step('Notification yang dibuka tercatat read tanpa mengubah persistence legacy', async () => {
      const feedback = await findProcessFeedback(authorApi, 'PROCESS_REVISION_REQUESTED')
      expect(feedback).toHaveLength(1)
      expect(feedback[0]?.readAt).not.toBeNull()
      const summary = await apiGet<{ unreadCount: number }>(authorApi, '/notifications/process/summary')
      expect(summary.unreadCount).toBe(0)
    })
  })
})
