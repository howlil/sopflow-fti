import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import {
  createDepartmentProcessViaAdminUi,
  assignDeanViaAdminUi,
  assignDepartmentHeadViaAdminUi,
} from '../support/fti-admin-actions'
import {
  adminApi,
  adminUserLabel,
  assignDeanViaAdminApi,
  createDepartmentViaAdminApi,
  listAdminDepartments,
  listAdminProcesses,
  listAdminUsers,
  listMyAuthorities,
  listMyProcesses,
  requireAdminUser,
  requireDepartment,
  requireProcess,
} from '../support/fti-admin-preconditions'
import {
  expectProcessDraftInMemberQueue,
  expectProcessReviewInOwnerQueue,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'
import { toApiUrl } from '../support/api'
import { waitForAppReady } from '../support/app'
import { e2eRunId, sopFixture } from '../support/test-data'

test.describe('End-to-End Business Journey — FTI administration bootstrap', () => {
  test('J20 Admin Entry Isolation — SUPER_ADMIN mengelola konfigurasi tanpa workflow bypass', async ({
    roleApi,
    roleSession,
  }) => {
    await test.step('SUPER_ADMIN melihat entry administrasi FTI dan API admin menerima sesi', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await admin.page.goto('/work')
      await waitForAppReady(admin.page)
      await expect(admin.page.getByRole('link', { name: 'Proses FTI', exact: true })).toBeVisible()
      await expect(
        admin.page.getByRole('link', { name: 'Kewenangan Organisasi', exact: true }),
      ).toBeVisible()

      const api = await adminApi(roleApi)
      expect((await api.get(toApiUrl('/process-admin/processes'))).status()).toBe(200)
      expect((await api.get(toApiUrl('/organizational-authority/configuration'))).status()).toBe(200)
    })

    await test.step('Identity workflow target tidak mendapat entry atau API administrasi', async () => {
      for (const actor of [
        targetUsers.processOwner,
        targetUsers.processMember,
        targetUsers.dean,
        targetUsers.headOfDepartment,
      ]) {
        const session = await roleSession(actor)
        await session.page.goto('/work')
        await waitForAppReady(session.page)
        await expect(
          session.page.getByRole('link', { name: 'Proses FTI', exact: true }),
        ).toHaveCount(0)
        await expect(
          session.page.getByRole('link', { name: 'Kewenangan Organisasi', exact: true }),
        ).toHaveCount(0)

        const api = await roleApi(actor)
        expect((await api.get(toApiUrl('/process-admin/processes'))).status()).toBe(403)
        expect((await api.get(toApiUrl('/organizational-authority/configuration'))).status()).toBe(403)
      }
    })

    await test.step('SUPER_ADMIN tanpa Process relationship tetap ditolak dari authoring target', async () => {
      expect(await listMyProcesses(roleApi, users.pjEvaluator)).toEqual([])
      expect(await listMyAuthorities(roleApi, users.pjEvaluator)).toEqual([])

      const process = (await listAdminProcesses(roleApi))[0]
      expect(process).toBeDefined()
      const fixture = sopFixture('J20')
      const api = await adminApi(roleApi)
      const response = await api.post(toApiUrl('/process-sop'), {
        data: {
          processId: process.processId,
          judul: fixture.title,
          nomorSop: fixture.number,
          namaLembaga: 'Fakultas Teknologi Informasi',
        },
      })
      expect(response.status()).toBe(403)
    })
  })

  test('J21 Process Configuration Bootstrap — admin UI membuat Department dan Process Team valid', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J21')
    const departmentName = `E2E Department ${suffix}`
    const processName = `E2E Process ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const owner = requireAdminUser(adminUsers, targetUsers.processOwner.email)
    const member = requireAdminUser(adminUsers, targetUsers.departmentMember.email)

    await test.step('SUPER_ADMIN membuat Department dan Department Process melalui UI target', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentProcessViaAdminUi(admin.page, {
        departmentName,
        processName,
        ownerLabel: adminUserLabel(owner),
        memberLabels: [adminUserLabel(member)],
      })
    })

    await test.step('Persisted scope, Department, Owner, dan Member sama dengan intent UI', async () => {
      const department = requireDepartment(await listAdminDepartments(roleApi), departmentName)
      const process = requireProcess(await listAdminProcesses(roleApi), processName)

      expect(process).toMatchObject({
        scope: 'DEPARTMENT',
        departmentId: department.departmentId,
        ownerId: owner.penggunaId,
      })
      expect(process.owner.penggunaId).toBe(owner.penggunaId)
      expect(process.members.map((row) => row.penggunaId)).toEqual([member.penggunaId])
      expect(process.members.some((row) => row.penggunaId === owner.penggunaId)).toBe(false)
    })

    await test.step('Assignment langsung menjadi Process context hanya bagi Owner dan Member', async () => {
      const ownerProcesses = await listMyProcesses(roleApi, targetUsers.processOwner)
      const memberProcesses = await listMyProcesses(roleApi, targetUsers.departmentMember)
      const unrelatedProcesses = await listMyProcesses(roleApi, targetUsers.otherDepartmentMember)

      expect(ownerProcesses.some((row) => row.nama === processName)).toBe(true)
      expect(memberProcesses.some((row) => row.nama === processName)).toBe(true)
      expect(unrelatedProcesses.some((row) => row.nama === processName)).toBe(false)
    })
  })

  test('J22 Organizational Authority Configuration — Dean dan Kadep deterministic serta terisolasi', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J22')
    const departmentName = `E2E Authority ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const originalDean = requireAdminUser(adminUsers, targetUsers.dean.email)
    const temporaryDean = requireAdminUser(adminUsers, targetUsers.otherDepartmentMember.email)
    const departmentHead = requireAdminUser(adminUsers, targetUsers.otherHeadOfDepartment.email)
    const department = await createDepartmentViaAdminApi(roleApi, departmentName)
    let deanRestored = false

    try {
      await test.step('Admin UI mengganti Dean dan assignment langsung berpindah ke holder baru', async () => {
        const admin = await roleSession(users.pjEvaluator)
        await assignDeanViaAdminUi(admin.page, adminUserLabel(temporaryDean))

        const temporaryAuthorities = await listMyAuthorities(roleApi, targetUsers.otherDepartmentMember)
        const originalAuthorities = await listMyAuthorities(roleApi, targetUsers.dean)
        expect(
          temporaryAuthorities.some(
            (row) => row.authority === 'DEAN' && row.departmentId === null,
          ),
        ).toBe(true)
        expect(originalAuthorities.some((row) => row.authority === 'DEAN')).toBe(false)
      })

      await test.step('Admin UI menetapkan satu Kadep untuk Department baru tanpa cross-scope leak', async () => {
        const admin = await roleSession(users.pjEvaluator)
        await assignDepartmentHeadViaAdminUi(
          admin.page,
          departmentName,
          adminUserLabel(departmentHead),
        )

        const holderAuthorities = await listMyAuthorities(roleApi, targetUsers.otherHeadOfDepartment)
        const unrelatedAuthorities = await listMyAuthorities(roleApi, targetUsers.processMember)
        expect(
          holderAuthorities.some(
            (row) =>
              row.authority === 'HEAD_OF_DEPARTMENT' &&
              row.departmentId === department.departmentId,
          ),
        ).toBe(true)
        expect(
          unrelatedAuthorities.some((row) => row.departmentId === department.departmentId),
        ).toBe(false)
      })

      await test.step('Seeded Dean dikembalikan setelah audit assignment global', async () => {
        await assignDeanViaAdminApi(roleApi, originalDean.penggunaId)
        deanRestored = true
        const restored = await listMyAuthorities(roleApi, targetUsers.dean)
        expect(restored.some((row) => row.authority === 'DEAN' && row.departmentId === null)).toBe(true)
      })
    } finally {
      if (!deanRestored) {
        await assignDeanViaAdminApi(roleApi, originalDean.penggunaId)
      }
    }
  })

  test('J23 Configuration Workflow Bootstrap — configured Member submit lalu Owner menerima review', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J23')
    const departmentName = `E2E Bootstrap ${suffix}`
    const processName = `E2E Bootstrap Process ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const owner = requireAdminUser(adminUsers, targetUsers.processOwner.email)
    const member = requireAdminUser(adminUsers, targetUsers.departmentMember.email)
    const departmentHead = requireAdminUser(adminUsers, targetUsers.headOfDepartment.email)

    await test.step('SUPER_ADMIN bootstrap Department, Process Team, dan Kadep melalui UI administrasi', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentProcessViaAdminUi(admin.page, {
        departmentName,
        processName,
        ownerLabel: adminUserLabel(owner),
        memberLabels: [adminUserLabel(member)],
      })
      await assignDepartmentHeadViaAdminUi(
        admin.page,
        departmentName,
        adminUserLabel(departmentHead),
      )
    })

    const sop = await seedReadyProcessSop(roleApi, 'J23-BOOTSTRAP', {
      actor: targetUsers.departmentMember,
      processName,
      institutionName: 'Fakultas Teknologi Informasi',
    })

    await test.step('Configured Member langsung melihat pekerjaan Process dan mengirim SOP untuk review', async () => {
      const memberSession = await roleSession(targetUsers.departmentMember)
      await expectProcessDraftInMemberQueue(memberSession.page, sop.title)
      await submitProcessSopForReviewViaUi(memberSession.page, sop.detailSopId)
    })

    await test.step('Configured Process Owner langsung menerima owner-review capability', async () => {
      const ownerSession = await roleSession(targetUsers.processOwner)
      await expectProcessReviewInOwnerQueue(ownerSession.page, sop.title)
    })

    await test.step('Platform admin tetap di luar workflow Process yang baru dibootstrap', async () => {
      const adminProcesses = await listMyProcesses(roleApi, users.pjEvaluator)
      expect(adminProcesses.some((row) => row.processId === sop.processId)).toBe(false)

      const api = await adminApi(roleApi)
      const response = await api.post(toApiUrl(`/process-sop/${sop.detailSopId}/review`), {
        data: { decision: 'REVISION' },
      })
      expect(response.status()).toBe(403)
    })
  })
})
