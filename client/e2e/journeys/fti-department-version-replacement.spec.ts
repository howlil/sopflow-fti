import { expect, test } from '../fixtures/business-test'
import { targetUsers, users } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import { signProcessSopViaUi } from '../support/fti-tte-actions'
import { e2ePin, validPdfBase64 } from '../support/test-data'
import {
  getProcessVersionHistory,
  seedReplacementReadyForTte,
} from '../support/fti-version-preconditions'

test.describe('End-to-End Business Journey — Department Process version replacement', () => {
  test('J18 Department Version Replacement — relevant Kadep replaces V1 and authority stays isolated', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const fixture = await seedReplacementReadyForTte(roleApi, 'J18-DEPT-REPLACE', {
      actor: targetUsers.departmentMember,
      processName: 'Layanan Akademik Informatika',
      institutionName: 'Departemen Teknik Informatika',
      authorityUser: targetUsers.headOfDepartment,
    })

    await test.step('Dean, Kadep Department lain, dan SUPER_ADMIN tidak dapat TTE V2 Department A', async () => {
      for (const deniedUser of [targetUsers.dean, targetUsers.otherHeadOfDepartment, users.pjEvaluator]) {
        const api = await roleApi(deniedUser)
        const response = await api.post(toApiUrl(`/process-tte/${fixture.v2.id}/sign`), {
          data: {
            pin: e2ePin,
            nomorDokumen: fixture.v2.nomorSOP,
            judulDokumen: fixture.v1.title,
            pdfBase64: validPdfBase64,
          },
        })
        expect(response.status()).toBe(403)
      }
    })

    await test.step('Relevant Kadep menandatangani V2 melalui contextual TTE UI', async () => {
      const head = await roleSession(targetUsers.headOfDepartment)
      await signProcessSopViaUi(head.page, fixture.v1.title)
    })

    await test.step('Department replacement menghasilkan satu current effective version', async () => {
      const history = await getProcessVersionHistory(
        roleApi,
        targetUsers.departmentMember,
        fixture.v1.sopId,
      )
      expect(history.find((row) => row.detailSopId === fixture.v1.detailSopId)?.status).toBe(
        'DIGANTIKAN',
      )
      expect(history.find((row) => row.detailSopId === fixture.v2.id)).toMatchObject({
        versi: 2,
        status: 'BERLAKU',
        revisiDariDetailSopId: fixture.v1.detailSopId,
      })
      expect(history.filter((row) => row.status === 'BERLAKU')).toHaveLength(1)
    })

    await test.step('Public artifact hanya current V2', async () => {
      const oldPdf = await publicPage.request.get(
        toApiUrl(`/sop/public/pdf/${fixture.v1.detailSopId}`),
      )
      const newPdf = await publicPage.request.get(toApiUrl(`/sop/public/pdf/${fixture.v2.id}`))
      expect(oldPdf.status()).toBe(404)
      expect(newPdf.status()).toBe(200)
    })
  })
})
