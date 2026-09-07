import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import {
  expectProsesBisnisSopBerlakuInWorkQueue,
  expectProsesBisnisSopInPublicArchive,
  signProsesBisnisSopViaUi,
} from '../support/fti-tte-actions'
import { seedProsesBisnisSopReadyForTte } from '../support/fti-tte-preconditions'

test.describe('End-to-End Business Journey — Departemen TTE and public integrity', () => {
  test('J15 Departemen TTE Public Integrity — relevant Kadep signs lalu SOP berlaku dan publik', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProsesBisnisSopReadyForTte(roleApi, 'J15-DEPT-TTE', {
      actor: targetUsers.departmentMember,
      namaProsesBisnis: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
      authorityUser: targetUsers.headOfDepartemen,
    })

    await test.step('Kadep Departemen lain tidak melihat SOP sebagai signing work miliknya', async () => {
      const otherHead = await roleSession(targetUsers.otherHeadOfDepartemen)
      await otherHead.page.goto('/approval')
      await waitForAppReady(otherHead.page)
      await expect(otherHead.page.getByRole('heading', { name: sop.title, exact: true })).toHaveCount(0)
      await expectNoAppShellError(otherHead.page)
    })

    await test.step('Relevant Kadep menandatangani SOP melalui real Proses Bisnis TTE path', async () => {
      const head = await roleSession(targetUsers.headOfDepartemen)
      await signProsesBisnisSopViaUi(head.page, sop.title)
    })

    await test.step('Departemen Anggota Proses Bisnis melihat SOP sudah berlaku', async () => {
      const member = await roleSession(targetUsers.departmentMember)
      await expectProsesBisnisSopBerlakuInWorkQueue(member.page, sop.title)
    })

    await test.step('Arsip publik menampilkan SOP Departemen tanpa data workflow internal', async () => {
      await expectProsesBisnisSopInPublicArchive(publicPage, sop.title)
    })
  })
})
