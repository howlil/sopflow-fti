import { users } from '../fixtures/users'
import { expect, test } from '../fixtures/business-test'
import {
  approveAllSopAsHeadViaUi,
  createVersionViaUi,
  revokeSopViaUi,
} from '../support/business-actions'
import { apiBaseURL } from '../support/api'
import { expectPengajuanStatus, expectSopStatus, getWorkbench } from '../support/business-audit'
import {
  advanceVersionToHeadSignaturePrecondition,
  seedApprovedSop,
} from '../support/business-preconditions'
import { e2ePin } from '../support/test-data'

test.describe('End-to-End Business Journey — SOP lifecycle', () => {
  test('J05 Version Replacement — versi baru berlaku menggantikan versi lama', async ({
    roleApi,
    roleSession,
  }) => {
    const original = await seedApprovedSop(roleApi, 'J05-V1')
    const penyusun = await roleSession(users.penyusun)
    const kepalaOpd = await roleSession(users.kepalaOpd)

    let newDetailId = ''
    let replacementPengajuanId = ''

    await test.step('Penyusun membuat versi baru dari SOP yang sedang berlaku melalui UI', async () => {
      newDetailId = await createVersionViaUi(penyusun.page, original.detailSopId)
      const newVersion = await getWorkbench(penyusun.api, newDetailId)
      expect(newVersion.detail.status).toBe('DRAFT')
      expect(newVersion.detail.versi ?? 0).toBeGreaterThan(1)
      await expectSopStatus(penyusun.api, original.detailSopId, 'BERLAKU')
    })

    await test.step('Workbench versi baru memakai navigation dan editor UI yang baru', async () => {
      const page = penyusun.page
      await expect(page.getByRole('link', { name: 'Manajemen SOP' })).toBeVisible()
      await expect(page.getByTitle('Kembali')).toHaveCount(0)
      await expect(page.getByRole('tab', { name: 'Properti' })).toBeVisible()

      const stepsButton = page.getByRole('button', { name: 'Langkah' })
      await expect(stepsButton).toBeVisible()
      await expect(stepsButton).toHaveAttribute('aria-pressed', 'false')
      await stepsButton.click()

      const spreadsheet = page.getByTestId('procedure-editor-scroll')
      await expect(spreadsheet).toBeVisible()
      await expect(spreadsheet.getByRole('columnheader', { name: 'Kegiatan' })).toBeVisible()
      await expect(spreadsheet.getByRole('columnheader', { name: 'Waktu' })).toBeVisible()

      await page.getByRole('button', { name: 'Selesai edit' }).click()
      await expect(page.getByRole('button', { name: 'Langkah' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    await test.step('Precondition membawa versi baru ke tahap pengesahan tanpa menduplikasi J01/J02', async () => {
      const newVersion = await getWorkbench(penyusun.api, newDetailId)
      replacementPengajuanId = await advanceVersionToHeadSignaturePrecondition(roleApi, {
        detailSopId: newDetailId,
        title: newVersion.detail.judul ?? original.title,
        baNumber: `${original.baNumber}-V2`,
      })
      await expectPengajuanStatus(
        kepalaOpd.api,
        replacementPengajuanId,
        'DITANDATANGANI_PJ_PENYUSUN',
      )
    })

    await test.step('Kepala OPD mengesahkan versi baru melalui UI', async () => {
      await approveAllSopAsHeadViaUi(kepalaOpd.page, replacementPengajuanId, e2ePin)
      await expectPengajuanStatus(kepalaOpd.api, replacementPengajuanId, 'SELESAI')
    })

    await test.step('Invariant version replacement: v2 BERLAKU dan v1 DIGANTIKAN', async () => {
      await expectSopStatus(penyusun.api, newDetailId, 'BERLAKU')
      await expectSopStatus(penyusun.api, original.detailSopId, 'DIGANTIKAN')
    })
  })

  test('J06 Revocation — pencabutan mengakhiri keberlakuan dan menghapus SOP dari arsip aktif', async ({
    publicPage,
    roleApi,
    roleSession,
  }) => {
    const approved = await seedApprovedSop(roleApi, 'J06-REVOKE')
    const kepalaOpd = await roleSession(users.kepalaOpd)

    await test.step('Kepala OPD mencabut SOP berlaku melalui UI', async () => {
      await revokeSopViaUi(kepalaOpd.page, approved.sopId)
      await expectSopStatus(kepalaOpd.api, approved.detailSopId, 'DICABUT')
    })

    await test.step('SOP dicabut tidak lagi tersedia pada arsip publik aktif', async () => {
      const response = await publicPage.request.get(`${apiBaseURL}/sop/public/sop`, {
        params: { search: approved.title, page: 1, limit: 20 },
      })
      await expect(response, 'endpoint arsip publik harus dapat diakses tanpa autentikasi').toBeOK()

      const body = (await response.json()) as {
        data?: { items?: Array<{ judul?: string }> }
      }
      const items = body.data?.items ?? []
      expect(items.some((item) => item.judul === approved.title)).toBe(false)
    })
  })
})
