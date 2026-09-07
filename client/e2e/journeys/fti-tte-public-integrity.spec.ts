import { test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  expectProsesBisnisSopBerlakuInWorkQueue,
  expectProsesBisnisSopInPublicArchive,
  signFacultyProsesBisnisSopViaUi,
} from '../support/fti-tte-actions'
import { seedProsesBisnisSopReadyForDeanTte } from '../support/fti-tte-preconditions'

test.describe('End-to-End Business Journey — Proses Bisnis TTE and public handoff', () => {
  test('J11 Proses Bisnis TTE Public Integrity — Dean signs, SOP berlaku, lalu tampil publik', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProsesBisnisSopReadyForDeanTte(roleApi, 'J11-TTE-PUBLIC')

    await test.step('Dekan menandatangani SOP melalui contextual Proses Bisnis TTE', async () => {
      const dean = await roleSession(targetUsers.dean)
      await signFacultyProsesBisnisSopViaUi(dean.page, sop.title)
    })

    await test.step('Proses Bisnis Team melihat SOP sudah berlaku', async () => {
      const member = await roleSession(targetUsers.anggotaProsesBisnis)
      await expectProsesBisnisSopBerlakuInWorkQueue(member.page, sop.title)
    })

    await test.step('Arsip publik menampilkan SOP Proses Bisnis berlaku tanpa data evaluasi internal', async () => {
      await expectProsesBisnisSopInPublicArchive(publicPage, sop.title)
    })
  })
})
