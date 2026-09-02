import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { apiGet, apiPost, toApiUrl } from '../support/api'
import {
  expectProcessSopAbsentFromPublicArchive,
  revokeProcessSopViaUi,
} from '../support/fti-revocation-actions'
import { seedEffectiveProcessSop } from '../support/fti-revocation-preconditions'
import { expectProcessSopInPublicArchive } from '../support/fti-tte-actions'

interface RevocationResult {
  detailSopId: string
  sopId: string
  processId: string
  status: 'DICABUT'
}

interface VersionHistoryRow {
  detailSopId: string
  status: string
}

test.describe('End-to-End Business Journey — contextual SOP revocation', () => {
  test('J28 Contextual Revocation Authority — Dean/Kadep mencabut hanya SOP dalam authority scope-nya', async ({
    roleApi,
    roleSession,
  }) => {
    const faculty = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J28-FACULTY',
      { actor: targetUsers.processMember },
      targetUsers.dean,
      'Fakultas · Dekan',
    )
    const department = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J28-DEPARTMENT',
      {
        actor: targetUsers.departmentMember,
        processName: 'Layanan Akademik Informatika',
        institutionName: 'Teknik Informatika',
      },
      targetUsers.headOfDepartment,
      'Teknik Informatika · Kepala Departemen',
    )

    await test.step('Wrong HoD, Process Owner, dan SUPER_ADMIN tanpa authority tidak dapat mencabut', async () => {
      for (const actor of [
        targetUsers.otherHeadOfDepartment,
        targetUsers.processOwner,
        users.pjEvaluator,
      ]) {
        const api = await roleApi(actor)
        const response = await api.post(
          toApiUrl(`/process-revocation/${department.detailSopId}/revoke`),
        )
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Dean mencabut SOP Faculty dan Kadep mencabut SOP Department', async () => {
      const deanApi = await roleApi(targetUsers.dean)
      const headApi = await roleApi(targetUsers.headOfDepartment)
      const facultyResult = await apiPost<RevocationResult>(
        deanApi,
        `/process-revocation/${faculty.detailSopId}/revoke`,
      )
      const departmentResult = await apiPost<RevocationResult>(
        headApi,
        `/process-revocation/${department.detailSopId}/revoke`,
      )
      expect(facultyResult.status).toBe('DICABUT')
      expect(departmentResult.status).toBe('DICABUT')
    })

    await test.step('Pencabutan ulang deterministic conflict', async () => {
      const deanApi = await roleApi(targetUsers.dean)
      const response = await deanApi.post(
        toApiUrl(`/process-revocation/${faculty.detailSopId}/revoke`),
      )
      expect(response.status()).toBe(409)
    })
  })

  test('J29 Authority Revocation Surface — Kadep mencabut SOP berlaku dari UI FTI-native', async ({
    roleApi,
    roleSession,
  }) => {
    const sop = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J29-UI',
      {
        actor: targetUsers.departmentMember,
        processName: 'Layanan Akademik Informatika',
        institutionName: 'Teknik Informatika',
      },
      targetUsers.headOfDepartment,
      'Teknik Informatika · Kepala Departemen',
    )

    const head = await roleSession(targetUsers.headOfDepartment)
    await revokeProcessSopViaUi(
      head.page,
      sop.title,
      'Teknik Informatika · Kepala Departemen',
    )

    const history = await apiGet<VersionHistoryRow[]>(
      await roleApi(targetUsers.departmentMember),
      `/sop/${sop.sopId}/riwayat-versi`,
    )
    expect(history.find((row) => row.detailSopId === sop.detailSopId)?.status).toBe('DICABUT')
  })

  test('J30 Effective/Public Integrity — revoked SOP keluar dari effective/public surface tanpa menghapus history', async ({
    roleApi,
    roleSession,
    publicPage,
  }) => {
    const sop = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J30-INTEGRITY',
      { actor: targetUsers.processMember },
      targetUsers.dean,
      'Fakultas · Dekan',
    )

    await expectProcessSopInPublicArchive(publicPage, sop.title)

    const deanApi = await roleApi(targetUsers.dean)
    await apiPost<RevocationResult>(
      deanApi,
      `/process-revocation/${sop.detailSopId}/revoke`,
    )

    await expectProcessSopAbsentFromPublicArchive(publicPage, sop.title)

    const publicDocument = await publicPage.request.get(
      toApiUrl(`/sop/public/dokumen/${sop.detailSopId}`),
    )
    const publicPdf = await publicPage.request.get(
      toApiUrl(`/sop/public/pdf/${sop.detailSopId}`),
    )
    expect(publicDocument.status()).toBe(404)
    expect(publicPdf.status()).toBe(404)

    const history = await apiGet<VersionHistoryRow[]>(
      await roleApi(targetUsers.processMember),
      `/sop/${sop.sopId}/riwayat-versi`,
    )
    expect(history.some((row) => row.detailSopId === sop.detailSopId && row.status === 'DICABUT')).toBe(true)
  })
})
