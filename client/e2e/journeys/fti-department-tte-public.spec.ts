import { test, expect } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import {
  expectProcessSopBerlakuInWorkQueue,
  expectProcessSopInPublicArchive,
  signProcessSopViaUi,
} from '../support/fti-tte-actions'
import { seedProcessSopReadyForTte } from '../support/fti-tte-preconditions'

test.describe('End-to-End Business Journey — Department TTE and public integrity', () => {
  test('J15 Department TTE Public Integrity — relevant Kadep signs lalu SOP berlaku dan publik', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const sop = await seedProcessSopReadyForTte(roleApi, 'J15-DEPT-TTE', {
      actor: targetUsers.departmentMember,
      processName: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
      authorityUser: targetUsers.headOfDepartment,
    })

    await test.step('Kadep Department lain tidak melihat SOP sebagai signing work miliknya', async () => {
      const otherHead = await roleSession(targetUsers.otherHeadOfDepartment)
      await otherHead.page.goto('/approval')
      await waitForAppReady(otherHead.page)
      await expect(otherHead.page.getByRole('heading', { name: sop.title, exact: true })).toHaveCount(0)
      await expectNoAppShellError(otherHead.page)
    })

    await test.step('Relevant Kadep menandatangani SOP melalui real Process TTE path', async () => {
      const head = await roleSession(targetUsers.headOfDepartment)
      await signProcessSopViaUi(head.page, sop.title)
    })

    await test.step('Department Process Member melihat SOP sudah berlaku', async () => {
      const member = await roleSession(targetUsers.departmentMember)
      await expectProcessSopBerlakuInWorkQueue(member.page, sop.title)
    })

    await test.step('Arsip publik menampilkan SOP Department tanpa data workflow internal', async () => {
      await expectProcessSopInPublicArchive(publicPage, sop.title)
    })
  })
})
