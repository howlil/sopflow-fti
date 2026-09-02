import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import { waitForAppReady } from '../support/app'
import {
  createDepartmentProcessViaAdminUi,
  createPlatformAccountViaAdminUi,
  assignDepartmentHeadViaAdminUi,
} from '../support/fti-admin-actions'
import {
  createPlatformAccountViaApi,
  expectPlatformAccountDenied,
  platformAccountFixture,
  platformAccountLabel,
  toDynamicE2eUser,
} from '../support/fti-account-preconditions'
import {
  adminApi,
  listMyAuthorities,
  listMyProcesses,
} from '../support/fti-admin-preconditions'
import {
  acceptProcessSopViaUi,
  approveProcessSopViaUi,
} from '../support/fti-approval-actions'
import {
  expectProcessDraftInMemberQueue,
  expectProcessReviewInOwnerQueue,
  submitProcessSopForReviewViaUi,
} from '../support/fti-process-actions'
import { seedReadyProcessSop } from '../support/fti-process-preconditions'
import {
  expectProcessSopBerlakuInWorkQueue,
  expectProcessSopInPublicArchive,
  signProcessSopViaUi,
} from '../support/fti-tte-actions'
import { ensureTteReady } from '../support/e2e-flow'
import { e2eRunId } from '../support/test-data'

interface AssignableUserRow {
  penggunaId: string
  nama: string
  email: string
}

test.describe('End-to-End Business Journey — FTI account provisioning bootstrap', () => {
  test('J24 Target Account Provisioning — SUPER_ADMIN membuat USER FTI yang dapat login tanpa workflow capability', async ({
    roleApi,
    roleSession,
  }) => {
    const fixture = platformAccountFixture(`J24-${e2eRunId('acct')}`)

    await test.step('SUPER_ADMIN membuat akun melalui target UI tanpa memilih OPD atau legacy role', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await admin.page.goto('/work')
      await waitForAppReady(admin.page)
      await expect(admin.page.getByRole('link', { name: 'Akun FTI', exact: true })).toBeVisible()
      await createPlatformAccountViaAdminUi(admin.page, fixture)
    })

    const accountUser = toDynamicE2eUser(fixture, 'M7 J24 account')

    await test.step('Akun baru dapat autentikasi tetapi belum memiliki Process/authority/admin capability', async () => {
      expect(await listMyProcesses(roleApi, accountUser)).toEqual([])
      expect(await listMyAuthorities(roleApi, accountUser)).toEqual([])

      const session = await roleSession(accountUser)
      await session.page.goto('/work')
      await waitForAppReady(session.page)
      await expect(session.page.getByRole('heading', { name: 'Beranda Kerja' })).toBeVisible()
      await expect(session.page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toHaveCount(0)
      await expect(session.page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toHaveCount(0)
      await expect(session.page.getByRole('link', { name: 'Akun FTI', exact: true })).toHaveCount(0)

      const api = await roleApi(accountUser)
      expect((await api.get(toApiUrl('/platform-accounts'))).status()).toBe(403)
    })

    await test.step('Duplicate identity ditolak dan ordinary USER tidak dapat provision account', async () => {
      const admin = await adminApi(roleApi)
      const duplicate = await admin.post(toApiUrl('/platform-accounts'), {
        data: {
          nama: fixture.nama,
          nip: fixture.nip,
          email: fixture.email,
          jabatan: fixture.jabatan,
          pangkat: fixture.pangkat,
          nohp: fixture.nohp,
        },
      })
      expect(duplicate.status()).toBe(409)

      await expectPlatformAccountDenied(
        roleApi,
        targetUsers.processMember,
        platformAccountFixture(`J24-denied-${e2eRunId('acct')}`),
      )
    })
  })

  test('J25 Account to Process Assignment — akun baru langsung assignable dan capability tetap contextual', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J25')
    const ownerFixture = platformAccountFixture(`J25-owner-${suffix}`)
    const memberFixture = platformAccountFixture(`J25-member-${suffix}`)
    const unrelatedFixture = platformAccountFixture(`J25-none-${suffix}`)
    const departmentName = `M7 Dept ${suffix}`
    const processName = `M7 Process ${suffix}`

    await createPlatformAccountViaApi(roleApi, ownerFixture)
    await createPlatformAccountViaApi(roleApi, memberFixture)
    await createPlatformAccountViaApi(roleApi, unrelatedFixture)

    const owner = toDynamicE2eUser(ownerFixture, 'M7 J25 Process Owner')
    const member = toDynamicE2eUser(memberFixture, 'M7 J25 Process Member')
    const unrelated = toDynamicE2eUser(unrelatedFixture, 'M7 J25 unrelated')

    await test.step('Akun baru langsung muncul dalam daftar assignable Process user', async () => {
      const admin = await adminApi(roleApi)
      const assignable = await apiGet<AssignableUserRow[]>(admin, '/process-admin/users')
      expect(assignable.some((row) => row.email === ownerFixture.email)).toBe(true)
      expect(assignable.some((row) => row.email === memberFixture.email)).toBe(true)
    })

    await test.step('SUPER_ADMIN membuat Process dengan fresh Owner dan Member melalui UI', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentProcessViaAdminUi(admin.page, {
        departmentName,
        processName,
        ownerLabel: platformAccountLabel(ownerFixture),
        memberLabels: [platformAccountLabel(memberFixture)],
      })
    })

    await test.step('Process relationship langsung tersedia hanya bagi identity yang ditugaskan', async () => {
      const ownerProcesses = await listMyProcesses(roleApi, owner)
      const memberProcesses = await listMyProcesses(roleApi, member)
      const unrelatedProcesses = await listMyProcesses(roleApi, unrelated)
      expect(ownerProcesses.some((row) => row.nama === processName)).toBe(true)
      expect(memberProcesses.some((row) => row.nama === processName)).toBe(true)
      expect(unrelatedProcesses.some((row) => row.nama === processName)).toBe(false)

      for (const actor of [owner, member]) {
        const session = await roleSession(actor)
        await session.page.goto('/work')
        await waitForAppReady(session.page)
        await expect(session.page.getByRole('link', { name: 'Pekerjaan SOP', exact: true })).toBeVisible()
      }
    })
  })

  test('J26 Account to Organizational Authority — fresh USER dapat menjadi Kadep tanpa authority leak', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J26')
    const headFixture = platformAccountFixture(`J26-head-${suffix}`)
    const unrelatedFixture = platformAccountFixture(`J26-none-${suffix}`)
    const departmentName = `M7 Authority ${suffix}`

    await createPlatformAccountViaApi(roleApi, headFixture)
    await createPlatformAccountViaApi(roleApi, unrelatedFixture)
    const head = toDynamicE2eUser(headFixture, 'M7 J26 Kadep')
    const unrelated = toDynamicE2eUser(unrelatedFixture, 'M7 J26 unrelated')

    await test.step('Account creation saja tidak memberi organizational authority', async () => {
      expect(await listMyAuthorities(roleApi, head)).toEqual([])
      expect(await listMyAuthorities(roleApi, unrelated)).toEqual([])
      expect(await listMyAuthorities(roleApi, users.pjEvaluator)).toEqual([])
    })

    await test.step('Admin membuat Department lalu memilih fresh USER sebagai Kadep lewat authority UI', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await admin.page.goto('/admin/processes')
      await waitForAppReady(admin.page)
      await admin.page.getByPlaceholder('Nama departemen').fill(departmentName)
      await admin.page.getByRole('button', { name: 'Tambah', exact: true }).click()
      await expect(admin.page.getByText(departmentName, { exact: true })).toBeVisible({ timeout: 15_000 })

      await assignDepartmentHeadViaAdminUi(
        admin.page,
        departmentName,
        platformAccountLabel(headFixture),
      )
    })

    await test.step('Authority langsung muncul hanya pada holder baru dan membuka target approval capability', async () => {
      const authorities = await listMyAuthorities(roleApi, head)
      expect(authorities.some((row) => row.authority === 'HEAD_OF_DEPARTMENT')).toBe(true)
      expect(await listMyAuthorities(roleApi, unrelated)).toEqual([])

      const session = await roleSession(head)
      await session.page.goto('/work')
      await waitForAppReady(session.page)
      await expect(session.page.getByRole('link', { name: 'Persetujuan & TTE', exact: true })).toBeVisible()
    })
  })

  test('J27 Zero-to-Workflow Bootstrap — fresh accounts menjalankan Department SOP sampai public BERLAKU', async ({
    roleApi,
    roleSession,
    publicPage,
  }) => {
    const suffix = e2eRunId('J27')
    const ownerFixture = platformAccountFixture(`J27-owner-${suffix}`)
    const memberFixture = platformAccountFixture(`J27-member-${suffix}`)
    const headFixture = platformAccountFixture(`J27-head-${suffix}`)
    const departmentName = `M7 Zero Dept ${suffix}`
    const processName = `M7 Zero Process ${suffix}`

    await createPlatformAccountViaApi(roleApi, ownerFixture)
    await createPlatformAccountViaApi(roleApi, memberFixture)
    await createPlatformAccountViaApi(roleApi, headFixture)

    const owner = toDynamicE2eUser(ownerFixture, 'M7 J27 Process Owner')
    const member = toDynamicE2eUser(memberFixture, 'M7 J27 Process Member')
    const head = toDynamicE2eUser(headFixture, 'M7 J27 Head of Department')

    await test.step('Bootstrap admin membuat Department, Process Team, dan Kadep dari fresh accounts', async () => {
      const admin = await roleSession(users.pjEvaluator)
      await createDepartmentProcessViaAdminUi(admin.page, {
        departmentName,
        processName,
        ownerLabel: platformAccountLabel(ownerFixture),
        memberLabels: [platformAccountLabel(memberFixture)],
      })
      await assignDepartmentHeadViaAdminUi(
        admin.page,
        departmentName,
        platformAccountLabel(headFixture),
      )
    })

    const sop = await seedReadyProcessSop(roleApi, 'J27-ZERO', {
      actor: member,
      processName,
      institutionName: departmentName,
    })

    await test.step('Fresh Member login, melihat draft, dan submit untuk Process review', async () => {
      const memberSession = await roleSession(member)
      await expectProcessDraftInMemberQueue(memberSession.page, sop.title)
      await submitProcessSopForReviewViaUi(memberSession.page, sop.detailSopId)
    })

    await test.step('Fresh Process Owner login, menerima review, dan handoff ke Kadep', async () => {
      const ownerSession = await roleSession(owner)
      await expectProcessReviewInOwnerQueue(ownerSession.page, sop.title)
      await acceptProcessSopViaUi(ownerSession.page, sop.detailSopId)
    })

    await test.step('Fresh Kadep login dan memberi final approval contextual', async () => {
      const headSession = await roleSession(head)
      await headSession.page.goto('/approval')
      await waitForAppReady(headSession.page)
      await approveProcessSopViaUi(
        headSession.page,
        sop.title,
        `${departmentName} · Kepala Departemen`,
      )
    })

    await test.step('Fresh Kadep menyiapkan TTE existing, menandatangani, dan SOP menjadi BERLAKU', async () => {
      const headApi = await roleApi(head)
      await ensureTteReady(headApi)
      const headSession = await roleSession(head)
      await signProcessSopViaUi(headSession.page, sop.title)

      const memberSession = await roleSession(member)
      await expectProcessSopBerlakuInWorkQueue(memberSession.page, sop.title)
    })

    await test.step('SOP hasil zero-to-workflow tersedia pada arsip publik', async () => {
      await expectProcessSopInPublicArchive(publicPage, sop.title)
    })
  })
})
