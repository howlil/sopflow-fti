import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import { e2ePin, validPdfBase64 } from '../support/test-data'
import {
  getProsesBisnisVersionHistory,
  seedReplacementReadyForTte,
} from '../support/fti-version-preconditions'

test.describe('End-to-End Business Journey — Proses Bisnis version historical/public integrity', () => {
  test('J19 Historical Public Integrity — failed V2 signing leaves V1 effective and public', async ({
    publicPage,
    roleApi,
  }) => {
    const fixture = await seedReplacementReadyForTte(roleApi, 'J19-INTEGRITY', {
      actor: targetUsers.anggotaProsesBisnis,
      authorityUser: targetUsers.dean,
    })

    await test.step('V1 is still the current public artifact before replacement signing', async () => {
      const oldDocument = await publicPage.request.get(
        toApiUrl(`/sop/public/dokumen/${fixture.v1.detailSopId}`),
      )
      const oldPdf = await publicPage.request.get(
        toApiUrl(`/sop/public/pdf/${fixture.v1.detailSopId}`),
      )
      const newDocument = await publicPage.request.get(
        toApiUrl(`/sop/public/dokumen/${fixture.v2.id}`),
      )
      expect(oldDocument.status()).toBe(200)
      expect(oldPdf.status()).toBe(200)
      expect(newDocument.status()).toBe(404)
    })

    await test.step('Failed V2 signing does not supersede V1 or publish V2', async () => {
      const deanApi = await roleApi(targetUsers.dean)
      const response = await deanApi.post(toApiUrl(`/tte-proses-bisnis/${fixture.v2.id}/sign`), {
        data: {
          pin: `${e2ePin}-wrong`,
          nomorDokumen: fixture.v2.nomorSOP,
          judulDokumen: fixture.v1.title,
          pdfBase64: validPdfBase64,
        },
      })
      expect(response.status()).toBe(403)

      const history = await getProsesBisnisVersionHistory(
        roleApi,
        targetUsers.anggotaProsesBisnis,
        fixture.v1.sopId,
      )
      expect(history.find((row) => row.detailSopId === fixture.v1.detailSopId)).toMatchObject({
        versi: 1,
        status: 'EFFECTIVE',
      })
      expect(history.find((row) => row.detailSopId === fixture.v2.id)).toMatchObject({
        versi: 2,
        status: 'TTE_PENDING',
        revisiDariDetailSopId: fixture.v1.detailSopId,
      })
      expect(history.filter((row) => row.status === 'EFFECTIVE')).toHaveLength(1)

      const oldPdf = await publicPage.request.get(
        toApiUrl(`/sop/public/pdf/${fixture.v1.detailSopId}`),
      )
      const newPdf = await publicPage.request.get(toApiUrl(`/sop/public/pdf/${fixture.v2.id}`))
      expect(oldPdf.status()).toBe(200)
      expect(newPdf.status()).toBe(410)
    })
  })
})
