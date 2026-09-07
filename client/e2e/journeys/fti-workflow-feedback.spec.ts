import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { apiGet } from '../support/api'
import {
  expectSingleProsesBisnisFeedback,
  findProsesBisnisFeedback,
  markAllNotifikasiProsesBisnissRead,
  openProsesBisnisFeedbackFromNotification,
  requestProsesBisnisRevisionViaApi,
} from '../support/fti-feedback-actions'
import { seedProsesBisnisSopAwaitingOwnerReview } from '../support/fti-approval-preconditions'
import { revokeProsesBisnisSopViaApi } from '../support/fti-revocation-actions'
import { seedEffectiveProsesBisnisSop } from '../support/fti-revocation-preconditions'

const namaProsesBisnis = 'Pengelolaan Akademik FTI'

test.describe('End-to-End Business Journey — Proses Bisnis workflow feedback closure', () => {
  test('J31 Revision Feedback — author menerima outcome revisi dari Penanggung Jawab Proses Bisnis', async ({
    roleApi,
  }) => {
    const sop = await seedProsesBisnisSopAwaitingOwnerReview(roleApi, 'J31-REVISION', {
      actor: targetUsers.anggotaProsesBisnis,
      namaProsesBisnis,
    })
    const authorApi = await roleApi(targetUsers.anggotaProsesBisnis)
    const ownerApi = await roleApi(targetUsers.processOwner)
    await markAllNotifikasiProsesBisnissRead(authorApi)
    await markAllNotifikasiProsesBisnissRead(ownerApi)

    await test.step('Penanggung Jawab Proses Bisnis mengembalikan SOP untuk revisi', async () => {
      await requestProsesBisnisRevisionViaApi(ownerApi, sop.detailSopId)
    })

    await test.step('Author menerima target-native revision feedback dan Penanggung Jawab Proses Bisnis tidak menerima copy sendiri', async () => {
      await expectSingleProsesBisnisFeedback(authorApi, 'PROCESS_REVISION_REQUESTED', {
        title: 'Revisi SOP Proses Bisnis diperlukan',
        preview: `SOP pada ProsesBisnis ${sop.namaProsesBisnis} dikembalikan untuk revisi.`,
      })
      expect(await findProsesBisnisFeedback(ownerApi, 'PROCESS_REVISION_REQUESTED')).toHaveLength(0)
    })
  })

  test('J32 Effective SOP Outcome — author dan Penanggung Jawab Proses Bisnis mengetahui SOP sudah berlaku', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J32-EFFECTIVE',
      { actor: targetUsers.anggotaProsesBisnis, namaProsesBisnis },
      targetUsers.dean,
      'Fakultas · Dekan',
    )

    await test.step('Author dan Penanggung Jawab Proses Bisnis masing-masing menerima satu effective feedback', async () => {
      for (const recipient of [targetUsers.anggotaProsesBisnis, targetUsers.processOwner]) {
        await expectSingleProsesBisnisFeedback(
          await roleApi(recipient),
          'PROCESS_SOP_EFFECTIVE',
          {
            title: 'SOP Proses Bisnis sudah berlaku',
            preview: `SOP pada ProsesBisnis ${sop.namaProsesBisnis} sudah efektif dan dipublikasikan.`,
          },
        )
      }
    })
  })

  test('J33 Revocation Feedback — author dan Penanggung Jawab Proses Bisnis mengetahui SOP sudah tidak berlaku', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J33-REVOKED',
      { actor: targetUsers.anggotaProsesBisnis, namaProsesBisnis },
      targetUsers.dean,
      'Fakultas · Dekan',
    )
    const authorApi = await roleApi(targetUsers.anggotaProsesBisnis)
    const ownerApi = await roleApi(targetUsers.processOwner)
    await markAllNotifikasiProsesBisnissRead(authorApi)
    await markAllNotifikasiProsesBisnissRead(ownerApi)

    await test.step('Contextual authority mencabut SOP yang berlaku', async () => {
      await revokeProsesBisnisSopViaApi(await roleApi(targetUsers.dean), sop.detailSopId)
    })

    await test.step('Author dan Penanggung Jawab Proses Bisnis masing-masing menerima revocation feedback', async () => {
      for (const api of [authorApi, ownerApi]) {
        await expectSingleProsesBisnisFeedback(api, 'PROCESS_SOP_REVOKED', {
          title: 'SOP Proses Bisnis sudah dicabut',
          preview: `SOP pada ProsesBisnis ${sop.namaProsesBisnis} sudah tidak berlaku.`,
        })
      }
    })
  })

  test('J34 Action & Inbox Integrity — feedback membuka work queue dan menjadi terbaca', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProsesBisnisSopAwaitingOwnerReview(roleApi, 'J34-INBOX', {
      actor: targetUsers.anggotaProsesBisnis,
      namaProsesBisnis,
    })
    const authorApi = await roleApi(targetUsers.anggotaProsesBisnis)
    await markAllNotifikasiProsesBisnissRead(authorApi)
    await requestProsesBisnisRevisionViaApi(await roleApi(targetUsers.processOwner), sop.detailSopId)

    const expected = {
      title: 'Revisi SOP Proses Bisnis diperlukan',
      preview: `SOP pada ProsesBisnis ${sop.namaProsesBisnis} dikembalikan untuk revisi.`,
    }
    const unreadFeedback = (await findProsesBisnisFeedback(authorApi, 'PROCESS_REVISION_REQUESTED')).filter(
      (item) => item.readAt === null,
    )
    expect(unreadFeedback).toHaveLength(1)
    expect(unreadFeedback[0]).toEqual(
      expect.objectContaining({
        kind: 'PROCESS_REVISION_REQUESTED',
        title: expected.title,
        preview: expected.preview,
        actionHref: '/work/queue',
      }),
    )
    const feedbackId = unreadFeedback[0]!.notifikasiProsesBisnisId

    await test.step('Unread count merefleksikan feedback sebelum user membukanya', async () => {
      const summary = await apiGet<{ unreadCount: number }>(authorApi, '/notifications/process/summary')
      expect(summary.unreadCount).toBe(1)
    })

    await test.step('Author membuka exact notification dan diarahkan ke target FTI-native work queue', async () => {
      const author = await roleSession(targetUsers.anggotaProsesBisnis)
      await openProsesBisnisFeedbackFromNotification(author.page, expected, feedbackId)
    })

    await test.step('Notification yang dibuka tercatat read tanpa mengubah persistence legacy', async () => {
      const feedback = await findProsesBisnisFeedback(authorApi, 'PROCESS_REVISION_REQUESTED')
      const openedFeedback = feedback.find((item) => item.notifikasiProsesBisnisId === feedbackId)
      expect(openedFeedback?.readAt).not.toBeNull()
      const summary = await apiGet<{ unreadCount: number }>(authorApi, '/notifications/process/summary')
      expect(summary.unreadCount).toBe(0)
    })
  })
})
