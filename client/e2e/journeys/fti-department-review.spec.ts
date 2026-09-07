import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import {
  expectProsesBisnisDraftInMemberQueue,
  expectPemeriksaanProsesBisnisInOwnerQueue,
  expectProsesBisnisRevisionInMemberQueue,
  requestProsesBisnisRevisionViaUi,
  submitProsesBisnisSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProsesBisnisSop } from '../support/fti-process-preconditions'

test.describe('End-to-End Business Journey — Departemen Penanggung Jawab Proses Bisnis review', () => {
  test('J13 Departemen Pemeriksaan Proses Bisnis — Member submit, Owner review, lalu kembali revisi', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedReadyProsesBisnisSop(roleApi, 'J13-DEPT-REVIEW', {
      actor: targetUsers.departmentMember,
      namaProsesBisnis: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
    })

    await test.step('Departemen Member melihat draft pada work queue', async () => {
      const anggota = await roleSession(targetUsers.departmentMember)
      await expectProsesBisnisDraftInMemberQueue(anggota.page, sop.title)
    })

    await test.step('Departemen Member mengirim SOP lengkap untuk Penanggung Jawab Proses Bisnis review', async () => {
      const anggota = await roleSession(targetUsers.departmentMember)
      await submitProsesBisnisSopForReviewViaUi(anggota.page, sop.detailSopId)
    })

    await test.step('Relevant Penanggung Jawab Proses Bisnis menerima pekerjaan review', async () => {
      const owner = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await expectPemeriksaanProsesBisnisInOwnerQueue(owner.page, sop.title)
    })

    await test.step('Relevant Penanggung Jawab Proses Bisnis mengembalikan SOP untuk revisi', async () => {
      const owner = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await requestProsesBisnisRevisionViaUi(owner.page, sop.detailSopId)
    })

    await test.step('Departemen Member menerima kembali SOP revisi dan Departemen B tetap ditolak', async () => {
      const anggota = await roleSession(targetUsers.departmentMember)
      await expectProsesBisnisRevisionInMemberQueue(anggota.page, sop.title)

      const unrelatedApi = await roleApi(targetUsers.otherDepartemenMember)
      const response = await unrelatedApi.get(
        toApiUrl(`/sop-proses-bisnis/workbench/${sop.detailSopId}`),
      )
      expect(response.status()).toBe(403)
    })
  })
})
