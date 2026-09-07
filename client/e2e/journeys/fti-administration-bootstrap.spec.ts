import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import {
  createDepartemenProsesBisnisViaAdminUi,
  assignDeanViaAdminUi,
  assignDepartemenHeadViaAdminUi,
} from '../support/fti-admin-actions'
import {
  adminApi,
  adminUserLabel,
  assignDeanViaAdminApi,
  createDepartemenViaAdminApi,
  listAdminDepartemens,
  listAdminProsesBisnises,
  listAdminUsers,
  listMyAuthorities,
  listMyProsesBisnises,
  requireAdminUser,
  requireDepartemen,
  requireProsesBisnis,
} from '../support/fti-admin-preconditions'
import {
  expectProsesBisnisDraftInMemberQueue,
  expectPemeriksaanProsesBisnisInOwnerQueue,
  submitProsesBisnisSopForReviewViaUi,
} from '../support/fti-proses-bisnis-actions'
import { seedReadyProsesBisnisSop } from '../support/fti-proses-bisnis-preconditions'
import { toApiUrl } from '../support/api'
import { waitForAppReady } from '../support/app'
import { e2eRunId, sopFixture } from '../support/test-data'

test.describe('End-to-End Business Journey — FTI administration bootstrap', () => {
  test('J20 Admin Entry Isolation — SUPER_ADMIN mengelola konfigurasi tanpa workflow bypass', async ({
    roleApi,
    roleSession,
  }) => {
    await test.step('SUPER_ADMIN melihat entry administrasi FTI dan API admin menerima sesi', async () => {
      const admin = await roleSession(targetUsers.admin)
      await admin.page.goto('/work')
      await waitForAppReady(admin.page)
      await expect(admin.page.getByRole('link', { name: 'Proses FTI', exact: true })).toBeVisible()
      await expect(
        admin.page.getByRole('link', { name: 'Kewenangan Organisasi', exact: true }),
      ).toBeVisible()

      const api = await adminApi(roleApi)
      expect((await api.get(toApiUrl('/administrasi-proses-bisnis/prosesBisnis'))).status()).toBe(200)
      expect((await api.get(toApiUrl('/pejabat-berwenang/configuration'))).status()).toBe(200)
    })

    await test.step('Identity workflow target tidak mendapat entry atau API administrasi', async () => {
      for (const actor of [
        targetUsers.penanggungJawabProsesBisnis,
        targetUsers.anggotaProsesBisnis,
        targetUsers.dean,
        targetUsers.headOfDepartemen,
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
        expect((await api.get(toApiUrl('/administrasi-proses-bisnis/prosesBisnis'))).status()).toBe(403)
        expect((await api.get(toApiUrl('/pejabat-berwenang/configuration'))).status()).toBe(403)
      }
    })

    await test.step('SUPER_ADMIN tanpa Proses Bisnis relationship tetap ditolak dari authoring target', async () => {
      expect(await listMyProsesBisnises(roleApi, targetUsers.admin)).toEqual([])
      expect(await listMyAuthorities(roleApi, targetUsers.admin)).toEqual([])

      const process = (await listAdminProsesBisnises(roleApi))[0]
      expect(process).toBeDefined()
      const fixture = sopFixture('J20')
      const api = await adminApi(roleApi)
      const response = await api.post(toApiUrl('/sop-proses-bisnis'), {
        data: {
          prosesBisnisId: process.prosesBisnisId,
          judul: fixture.title,
          nomorSop: fixture.number,
          namaLembaga: 'Fakultas Teknologi Informasi',
        },
      })
      expect(response.status()).toBe(403)
    })
  })

  test('J21 Proses Bisnis Configuration Bootstrap — admin UI membuat Departemen dan Tim Proses Bisnis valid', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J21')
    const namaDepartemen = `E2E Departemen ${suffix}`
    const namaProsesBisnis = `E2E ProsesBisnis ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const owner = requireAdminUser(adminUsers, targetUsers.penanggungJawabProsesBisnis.email)
    const anggota = requireAdminUser(adminUsers, targetUsers.departmentMember.email)

    await test.step('SUPER_ADMIN membuat Departemen dan Departemen Proses Bisnis melalui UI target', async () => {
      const admin = await roleSession(targetUsers.admin)
      await createDepartemenProsesBisnisViaAdminUi(admin.page, {
        namaDepartemen,
        namaProsesBisnis,
        ownerLabel: adminUserLabel(owner),
        memberLabels: [adminUserLabel(anggota)],
      })
    })

    await test.step('Persisted lingkup, Departemen, Owner, dan Member sama dengan intent UI', async () => {
      const department = requireDepartemen(await listAdminDepartemens(roleApi), namaDepartemen)
      const process = requireProsesBisnis(await listAdminProsesBisnises(roleApi), namaProsesBisnis)

      expect(process).toMatchObject({
        lingkup: 'DEPARTMENT',
        departemenId: department.departemenId,
        penanggungJawabId: owner.penggunaId,
      })
      expect(process.penanggungJawab.penggunaId).toBe(owner.penggunaId)
      expect(process.anggota.map((row) => row.penggunaId)).toEqual([anggota.penggunaId])
      expect(process.anggota.some((row) => row.penggunaId === owner.penggunaId)).toBe(false)
    })

    await test.step('Assignment langsung menjadi Proses Bisnis context hanya bagi Owner dan Member', async () => {
      const ownerProsesBisnises = await listMyProsesBisnises(roleApi, targetUsers.penanggungJawabProsesBisnis)
      const memberProsesBisnises = await listMyProsesBisnises(roleApi, targetUsers.departmentMember)
      const unrelatedProsesBisnises = await listMyProsesBisnises(roleApi, targetUsers.otherDepartemenMember)

      expect(ownerProsesBisnises.some((row) => row.nama === namaProsesBisnis)).toBe(true)
      expect(memberProsesBisnises.some((row) => row.nama === namaProsesBisnis)).toBe(true)
      expect(unrelatedProsesBisnises.some((row) => row.nama === namaProsesBisnis)).toBe(false)
    })
  })

  test('J22 Pejabat Berwenang Configuration — Dean dan Kadep deterministic serta terisolasi', async ({
    roleApi,
    roleSession,
  }) => {
    const suffix = e2eRunId('J22')
    const namaDepartemen = `E2E Authority ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const originalDean = requireAdminUser(adminUsers, targetUsers.dean.email)
    const temporaryDean = requireAdminUser(adminUsers, targetUsers.otherDepartemenMember.email)
    const departmentHead = requireAdminUser(adminUsers, targetUsers.otherHeadOfDepartemen.email)
    const department = await createDepartemenViaAdminApi(roleApi, namaDepartemen)
    let deanRestored = false

    try {
      await test.step('Admin UI mengganti Dean dan assignment langsung berpindah ke holder baru', async () => {
        const admin = await roleSession(targetUsers.admin)
        await assignDeanViaAdminUi(admin.page, adminUserLabel(temporaryDean))

        const temporaryAuthorities = await listMyAuthorities(roleApi, targetUsers.otherDepartemenMember)
        const originalAuthorities = await listMyAuthorities(roleApi, targetUsers.dean)
        expect(
          temporaryAuthorities.some(
            (row) => row.authority === 'DEAN' && row.departemenId === null,
          ),
        ).toBe(true)
        expect(originalAuthorities.some((row) => row.authority === 'DEAN')).toBe(false)
      })

      await test.step('Admin UI menetapkan satu Kadep untuk Departemen baru tanpa cross-lingkup leak', async () => {
        const admin = await roleSession(targetUsers.admin)
        await assignDepartemenHeadViaAdminUi(
          admin.page,
          namaDepartemen,
          adminUserLabel(departmentHead),
        )

        const holderAuthorities = await listMyAuthorities(roleApi, targetUsers.otherHeadOfDepartemen)
        const unrelatedAuthorities = await listMyAuthorities(roleApi, targetUsers.anggotaProsesBisnis)
        expect(
          holderAuthorities.some(
            (row) =>
              row.authority === 'HEAD_OF_DEPARTMENT' &&
              row.departemenId === department.departemenId,
          ),
        ).toBe(true)
        expect(
          unrelatedAuthorities.some((row) => row.departemenId === department.departemenId),
        ).toBe(false)
      })

      await test.step('Seeded Dean dikembalikan setelah audit assignment global', async () => {
        await assignDeanViaAdminApi(roleApi, originalDean.penggunaId)
        deanRestored = true
        const restored = await listMyAuthorities(roleApi, targetUsers.dean)
        expect(restored.some((row) => row.authority === 'DEAN' && row.departemenId === null)).toBe(true)
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
    const namaDepartemen = `E2E Bootstrap ${suffix}`
    const namaProsesBisnis = `E2E Bootstrap ProsesBisnis ${suffix}`
    const adminUsers = await listAdminUsers(roleApi)
    const owner = requireAdminUser(adminUsers, targetUsers.penanggungJawabProsesBisnis.email)
    const anggota = requireAdminUser(adminUsers, targetUsers.departmentMember.email)
    const departmentHead = requireAdminUser(adminUsers, targetUsers.headOfDepartemen.email)

    await test.step('SUPER_ADMIN bootstrap Departemen, Tim Proses Bisnis, dan Kadep melalui UI administrasi', async () => {
      const admin = await roleSession(targetUsers.admin)
      await createDepartemenProsesBisnisViaAdminUi(admin.page, {
        namaDepartemen,
        namaProsesBisnis,
        ownerLabel: adminUserLabel(owner),
        memberLabels: [adminUserLabel(anggota)],
      })
      await assignDepartemenHeadViaAdminUi(
        admin.page,
        namaDepartemen,
        adminUserLabel(departmentHead),
      )
    })

    const sop = await seedReadyProsesBisnisSop(roleApi, 'J23-BOOTSTRAP', {
      actor: targetUsers.departmentMember,
      namaProsesBisnis,
      institutionName: 'Fakultas Teknologi Informasi',
    })

    await test.step('Configured Member langsung melihat pekerjaan Proses Bisnis dan mengirim SOP untuk review', async () => {
      const memberSession = await roleSession(targetUsers.departmentMember)
      await expectProsesBisnisDraftInMemberQueue(memberSession.page, sop.title)
      await submitProsesBisnisSopForReviewViaUi(memberSession.page, sop.detailSopId)
    })

    await test.step('Configured Penanggung Jawab Proses Bisnis langsung menerima owner-review capability', async () => {
      const ownerSession = await roleSession(targetUsers.penanggungJawabProsesBisnis)
      await expectPemeriksaanProsesBisnisInOwnerQueue(ownerSession.page, sop.title)
    })

    await test.step('Platform admin tetap di luar workflow Proses Bisnis yang baru dibootstrap', async () => {
      const adminProsesBisnises = await listMyProsesBisnises(roleApi, targetUsers.admin)
      expect(adminProsesBisnises.some((row) => row.prosesBisnisId === sop.prosesBisnisId)).toBe(false)

      const api = await adminApi(roleApi)
      const response = await api.post(toApiUrl(`/sop-proses-bisnis/${sop.detailSopId}/review`), {
        data: { decision: 'REVISION' },
      })
      expect(response.status()).toBe(403)
    })
  })
})
