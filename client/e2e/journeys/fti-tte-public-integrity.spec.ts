import { test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  expectProcessSopBerlakuInWorkQueue,
  expectProcessSopInPublicArchive,
  signFacultyProcessSopViaUi,
} from '../support/fti-tte-actions'
import { seedProcessSopReadyForDeanTte } from '../support/fti-tte-preconditions'

test.describe('End-to-End Business Journey — Process TTE and public handoff', () => {
  test('J11 Process TTE Public Integrity — Dean signs, SOP berlaku, lalu tampil publik', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProcessSopReadyForDeanTte(roleApi, 'J11-TTE-PUBLIC')

    await test.step('Dekan menandatangani SOP melalui contextual Process TTE', async () => {
      const dean = await roleSession(targetUsers.dean)
      await signFacultyProcessSopViaUi(dean.page, sop.title)
    })

    await test.step('Process Team melihat SOP sudah berlaku', async () => {
      const member = await roleSession(targetUsers.processMember)
      await expectProcessSopBerlakuInWorkQueue(member.page, sop.title)
    })

    await test.step('Arsip publik menampilkan SOP Process berlaku tanpa data evaluasi internal', async () => {
      await expectProcessSopInPublicArchive(publicPage, sop.title)
    })
  })
})
