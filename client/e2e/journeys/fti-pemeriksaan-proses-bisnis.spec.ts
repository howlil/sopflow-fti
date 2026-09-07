import { test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  expectProsesBisnisDraftInMemberQueue,
  expectPemeriksaanProsesBisnisInOwnerQueue,
  expectProsesBisnisRevisionInMemberQueue,
  requestProsesBisnisRevisionViaUi,
  submitProsesBisnisSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProsesBisnisSop } from '../support/fti-process-preconditions'

test.describe('End-to-End Business Journey — Proses Bisnis work and owner review', () => {
  test('J09 Penanggung Jawab Proses Bisnis Review — Member submit, Owner review, lalu kembali revisi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedReadyProsesBisnisSop(roleApi, 'J09-PROCESS-REVIEW')

    await test.step('Anggota Proses Bisnis melihat draft Proses Bisnis pada work queue', async () => {
      const anggota = await roleSession(targetUsers.anggotaProsesBisnis)
      await expectProsesBisnisDraftInMemberQueue(anggota.page, sop.title)
    })

    await test.step('Anggota Proses Bisnis mengirim SOP lengkap untuk review melalui UI', async () => {
      const anggota = await roleSession(targetUsers.anggotaProsesBisnis)
      await submitProsesBisnisSopForReviewViaUi(anggota.page, sop.detailSopId)
    })

    await test.step('Penanggung Jawab Proses Bisnis melihat SOP sebagai review yang memerlukan tindakan', async () => {
      const owner = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await expectPemeriksaanProsesBisnisInOwnerQueue(owner.page, sop.title)
    })

    await test.step('Penanggung Jawab Proses Bisnis mengembalikan SOP untuk revisi melalui UI', async () => {
      const owner = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await requestProsesBisnisRevisionViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Anggota Proses Bisnis menerima kembali SOP sebagai pekerjaan revisi', async () => {
      const anggota = await roleSession(targetUsers.anggotaProsesBisnis)
      await expectProsesBisnisRevisionInMemberQueue(anggota.page, sop.title)
    })
  })
})
