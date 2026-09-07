import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import {
  expectProsesBisnisSopAbsentFromPublicArchive,
  expectRevocationRejectedViaApi,
  revokeProsesBisnisSopViaApi,
  revokeProsesBisnisSopViaUi,
} from '../support/fti-revocation-actions'
import { seedEffectiveProsesBisnisSop } from '../support/fti-revocation-preconditions'
import { expectProsesBisnisSopInPublicArchive } from '../support/fti-tte-actions'

interface VersionHistoryRow {
  detailSopId: string
  status: string
}

test.describe('End-to-End Business Journey — contextual SOP revocation', () => {
  test('J28 Contextual Revocation Authority — Dean/Kadep mencabut hanya SOP dalam authority lingkup-nya', async ({
    roleApi,
    roleSession,
  }) => {
    const faculty = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J28-FACULTY',
      { actor: targetUsers.anggotaProsesBisnis },
      targetUsers.dean,
      'Fakultas · Dekan',
    )
    const department = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J28-DEPARTMENT',
      {
        actor: targetUsers.departmentMember,
        namaProsesBisnis: 'Layanan Akademik Informatika',
        institutionName: 'Teknik Informatika',
      },
      targetUsers.headOfDepartemen,
      'Teknik Informatika · Kepala Departemen',
    )

    await test.step('Wrong HoD, Penanggung Jawab Proses Bisnis, dan SUPER_ADMIN tanpa authority tidak dapat mencabut', async () => {
      for (const actor of [
        targetUsers.otherHeadOfDepartemen,
        targetUsers.penanggungJawabProsesBisnis,
        users.pjEvaluator,
      ]) {
        await expectRevocationRejectedViaApi(
          await roleApi(actor),
          department.detailSopId,
          403,
        )
      }
    })

    await test.step('Dean mencabut SOP Faculty dan Kadep mencabut SOP Departemen', async () => {
      const facultyResult = await revokeProsesBisnisSopViaApi(
        await roleApi(targetUsers.dean),
        faculty.detailSopId,
      )
      const departmentResult = await revokeProsesBisnisSopViaApi(
        await roleApi(targetUsers.headOfDepartemen),
        department.detailSopId,
      )
      expect(facultyResult.status).toBe('REVOKED')
      expect(departmentResult.status).toBe('REVOKED')
    })

    await test.step('Pencabutan ulang deterministic conflict', async () => {
      await expectRevocationRejectedViaApi(
        await roleApi(targetUsers.dean),
        faculty.detailSopId,
        409,
      )
    })
  })

  test('J29 Authority Revocation Surface — Kadep mencabut SOP berlaku dari UI FTI-native', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J29-UI',
      {
        actor: targetUsers.departmentMember,
        namaProsesBisnis: 'Layanan Akademik Informatika',
        institutionName: 'Teknik Informatika',
      },
      targetUsers.headOfDepartemen,
      'Teknik Informatika · Kepala Departemen',
    )

    const head = await roleSession(targetUsers.headOfDepartemen)
    await revokeProsesBisnisSopViaUi(
      head.page,
      sop.title,
      'Teknik Informatika · Kepala Departemen',
    )

    const history = await apiGet<VersionHistoryRow[]>(
      await roleApi(targetUsers.departmentMember),
      `/sop/${sop.sopId}/riwayat-versi`,
    )
    expect(history.find((row) => row.detailSopId === sop.detailSopId)?.status).toBe('REVOKED')
  })

  test('J30 Effective/Public Integrity — revoked SOP keluar dari effective/public surface tanpa menghapus history', async ({
    roleApi,
    roleSession,
    publicPage,
  }) => {
    const sop = await seedEffectiveProsesBisnisSop(
      roleApi,
      roleSession,
      'J30-INTEGRITY',
      { actor: targetUsers.anggotaProsesBisnis },
      targetUsers.dean,
      'Fakultas · Dekan',
    )

    await expectProsesBisnisSopInPublicArchive(publicPage, sop.title)

    await revokeProsesBisnisSopViaApi(
      await roleApi(targetUsers.dean),
      sop.detailSopId,
    )

    await expectProsesBisnisSopAbsentFromPublicArchive(publicPage, sop.title)

    const publicDocument = await publicPage.request.get(
      toApiUrl(`/sop/public/dokumen/${sop.detailSopId}`),
    )
    const publicPdf = await publicPage.request.get(
      toApiUrl(`/sop/public/pdf/${sop.detailSopId}`),
    )
    expect(publicDocument.status()).toBe(404)
    expect(publicPdf.status()).toBe(410)

    const history = await apiGet<VersionHistoryRow[]>(
      await roleApi(targetUsers.anggotaProsesBisnis),
      `/sop/${sop.sopId}/riwayat-versi`,
    )
    expect(history.some((row) => row.detailSopId === sop.detailSopId && row.status === 'REVOKED')).toBe(true)
  })
})
