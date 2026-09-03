import type { ReadyProcessSopFixture } from '../support/fti-process-preconditions'
import { expect, test } from '../fixtures/business-test'
import { targetUsers } from '../fixtures/users'
import { apiGet, toApiUrl } from '../support/api'
import { expectNoAppShellError, waitForAppReady } from '../support/app'
import { revokeProcessSopViaApi } from '../support/fti-revocation-actions'
import { seedEffectiveProcessSop } from '../support/fti-revocation-preconditions'

interface PublicProcessPage {
  items: Array<{
    processId: string
    nama: string
    scope: 'FACULTY' | 'DEPARTMENT'
    departmentName: string | null
    jumlahSopBerlaku: number
  }>
}

interface PublicSopPage {
  items: Array<{
    detailSopId: string
    sopId: string
    judul: string
    nomorSOP: string
    processId: string | null
    processName: string | null
    scope: 'FACULTY' | 'DEPARTMENT' | null
    departmentName: string | null
    pdfUrl: string
  }>
}

let effectiveSop: ReadyProcessSopFixture | undefined

function requireEffectiveSop(): ReadyProcessSopFixture {
  if (!effectiveSop) throw new Error('J35 harus membentuk SOP efektif sebelum journey berikutnya')
  return effectiveSop
}

test.describe.serial('End-to-End Business Journey — FTI-native public archive', () => {
  test('J35 Public FTI Catalog — ProcessSopBinding menjadi klasifikasi public Process', async ({
    request,
    roleApi,
    roleSession,
  }) => {
    effectiveSop = await seedEffectiveProcessSop(
      roleApi,
      roleSession,
      'J35-PUBLIC-FTI',
      { actor: targetUsers.processMember, processName: 'Pengelolaan Akademik FTI' },
      targetUsers.dean,
      'Fakultas · Dekan',
    )

    const processPage = await apiGet<PublicProcessPage>(
      request,
      `/sop/public/fti/processes?search=${encodeURIComponent(effectiveSop.processName)}`,
    )
    const process = processPage.items.find((item) => item.processId === effectiveSop!.processId)
    expect(process).toEqual(
      expect.objectContaining({
        processId: effectiveSop.processId,
        nama: effectiveSop.processName,
        scope: 'FACULTY',
      }),
    )

    const sopPage = await apiGet<PublicSopPage>(
      request,
      `/sop/public/fti/processes/${encodeURIComponent(effectiveSop.processId)}/sop`,
    )
    expect(sopPage.items).toContainEqual(
      expect.objectContaining({
        detailSopId: effectiveSop.detailSopId,
        processId: effectiveSop.processId,
        processName: effectiveSop.processName,
      }),
    )
  })

  test('J36 Public Process Discovery — visitor menelusuri Process lalu SOP tanpa OPD picker', async ({
    publicPage,
  }) => {
    const sop = requireEffectiveSop()
    await publicPage.goto('/arsip')
    await waitForAppReady(publicPage)

    const process = publicPage.locator(`[data-arsip-process-id="${sop.processId}"]`).first()
    await expect(process).toBeVisible({ timeout: 15_000 })
    await expect(process).toContainText(sop.processName)
    await process.click()

    await publicPage.waitForURL(
      (url) => url.pathname === '/arsip' && url.searchParams.get('processId') === sop.processId,
      { timeout: 15_000 },
    )
    await expect(publicPage.getByText(sop.title, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(publicPage.locator('body')).not.toContainText('Pilih OPD')
    await expectNoAppShellError(publicPage)
  })

  test('J37 Official Document Continuity — SOP Process membuka artifact PDF resmi yang sama', async ({
    publicPage,
    request,
  }) => {
    const sop = requireEffectiveSop()
    const search = await apiGet<PublicSopPage>(
      request,
      `/sop/public/fti/sop?search=${encodeURIComponent(sop.title)}`,
    )
    const publicItem = search.items.find((item) => item.detailSopId === sop.detailSopId)
    expect(publicItem).toBeTruthy()

    const pdf = await request.get(toApiUrl(publicItem!.pdfUrl))
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')

    await publicPage.goto(
      `/arsip?processId=${encodeURIComponent(sop.processId)}&detailSopId=${encodeURIComponent(sop.detailSopId)}`,
    )
    await waitForAppReady(publicPage)
    await expect(publicPage.getByRole('link', { name: 'Buka', exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(publicPage.getByText(sop.processName).first()).toBeVisible()
    await expectNoAppShellError(publicPage)
  })

  test('J38 Publication Compatibility — target search tidak duplikat dan revocation menghapus current public result', async ({
    request,
    roleApi,
  }) => {
    const sop = requireEffectiveSop()
    const before = await apiGet<PublicSopPage>(
      request,
      `/sop/public/fti/sop?search=${encodeURIComponent(sop.title)}`,
    )
    expect(before.items.filter((item) => item.detailSopId === sop.detailSopId)).toHaveLength(1)

    const legacyEndpoint = await request.get(toApiUrl('/sop/public/opd?page=1&limit=1'))
    expect(legacyEndpoint.ok(), 'legacy OPD public endpoint tetap tersedia sebagai compatibility API').toBe(
      true,
    )

    await revokeProcessSopViaApi(await roleApi(targetUsers.dean), sop.detailSopId)

    const after = await apiGet<PublicSopPage>(
      request,
      `/sop/public/fti/sop?search=${encodeURIComponent(sop.title)}`,
    )
    expect(after.items.some((item) => item.detailSopId === sop.detailSopId)).toBe(false)

    const pdfAfterRevoke = await request.get(toApiUrl(`/sop/public/pdf/${sop.detailSopId}`))
    expect(pdfAfterRevoke.status()).toBe(410)
  })
})
