import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { toApiUrl } from '../support/api'
import { signProsesBisnisSopViaUi } from '../support/fti-tte-actions'
import {
  getProsesBisnisVersionHistory,
  seedReplacementReadyForTte,
} from '../support/fti-version-preconditions'

test.describe('End-to-End Business Journey — Faculty Proses Bisnis version replacement', () => {
  test('J17 Faculty Version Replacement — Dean TTE atomically replaces V1 with V2', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const fixture = await seedReplacementReadyForTte(roleApi, 'J17-FACULTY-REPLACE', {
      actor: targetUsers.anggotaProsesBisnis,
      authorityUser: targetUsers.dean,
    })

    await test.step('Dean menandatangani V2 melalui contextual TTE UI', async () => {
      const dean = await roleSession(targetUsers.dean)
      await signProsesBisnisSopViaUi(dean.page, fixture.v1.title)
    })

    await test.step('Replacement meninggalkan tepat satu versi BERLAKU', async () => {
      const history = await getProsesBisnisVersionHistory(
        roleApi,
        targetUsers.anggotaProsesBisnis,
        fixture.v1.sopId,
      )
      expect(history).toHaveLength(2)
      expect(history.find((row) => row.detailSopId === fixture.v1.detailSopId)).toMatchObject({
        versi: 1,
        status: 'SUPERSEDED',
      })
      expect(history.find((row) => row.detailSopId === fixture.v2.id)).toMatchObject({
        versi: 2,
        status: 'EFFECTIVE',
        revisiDariDetailSopId: fixture.v1.detailSopId,
      })
      expect(history.filter((row) => row.status === 'EFFECTIVE')).toHaveLength(1)
    })

    await test.step('Public document/PDF hanya tersedia untuk V2 current', async () => {
      const oldDocument = await publicPage.request.get(
        toApiUrl(`/sop/public/dokumen/${fixture.v1.detailSopId}`),
      )
      const newDocument = await publicPage.request.get(
        toApiUrl(`/sop/public/dokumen/${fixture.v2.id}`),
      )
      const oldPdf = await publicPage.request.get(
        toApiUrl(`/sop/public/pdf/${fixture.v1.detailSopId}`),
      )
      const newPdf = await publicPage.request.get(toApiUrl(`/sop/public/pdf/${fixture.v2.id}`))

      expect(oldDocument.status()).toBe(404)
      expect(oldPdf.status()).toBe(410)
      expect(newDocument.status()).toBe(200)
      expect(newPdf.status()).toBe(200)
    })
  })
})
