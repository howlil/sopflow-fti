import { test, request as playwrightRequest, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { users, type E2eUser } from './fixtures/users'
import { apiBaseURL } from './support/api'
import { createReadySopFixture } from './support/e2e-flow'
import { waitForAppReady } from './support/app'

const clientDir = fileURLToPath(new URL('..', import.meta.url))
const projectRootDir = path.resolve(clientDir, '..')
const screenshotsBaseDir = path.resolve(projectRootDir, 'docs', 'screenshots')

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

async function loginAs(page: Page, user: E2eUser): Promise<void> {
  await page.goto('/login')
  await waitForAppReady(page)
  await page.locator('input[type="email"], input[name="email"], input#email').first().fill(user.email)
  await page.locator('input[type="password"], input[name="password"], input#password').first().fill(user.password)
  await page.getByRole('button', { name: /^masuk$/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

test.describe.configure({ mode: 'serial' })

test.describe('Comprehensive E2E Screenshots Generator', () => {
  let sampleSopId = ''
  let sampleDetailSopId = ''
  let activePengajuanId = ''
  let dinkesOpdId = ''

  test.beforeAll(async () => {
    ensureDir(screenshotsBaseDir)
    ensureDir(path.join(screenshotsBaseDir, '01_publik'))
    ensureDir(path.join(screenshotsBaseDir, '02_pj_evaluator'))
    ensureDir(path.join(screenshotsBaseDir, '03_evaluator'))
    ensureDir(path.join(screenshotsBaseDir, '04_pj_penyusun'))
    ensureDir(path.join(screenshotsBaseDir, '05_penyusun'))
    ensureDir(path.join(screenshotsBaseDir, '06_kepala_opd'))

    try {
      const pjEvaluatorApi = await playwrightRequest.newContext({ baseURL: apiBaseURL })
      const loginPj = await pjEvaluatorApi.post(`${apiBaseURL}/auth/login`, {
        data: { email: users.pjEvaluator.email, password: users.pjEvaluator.password },
      })
      const pjCookie = loginPj.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value.split(';')[0] || ''
      const pjAuthedApi = await playwrightRequest.newContext({
        baseURL: apiBaseURL,
        extraHTTPHeaders: { cookie: pjCookie },
      })

      // Get OPDs
      const opdsRes = await pjAuthedApi.get(`${apiBaseURL}/opd`)
      if (opdsRes.ok()) {
        const opdsJson = await opdsRes.json()
        const opds = opdsJson.data || opdsJson || []
        const dinkes = opds.find((o: any) => (o.nama || o.namaOpd || '').toLowerCase().includes('kesehatan'))
        dinkesOpdId = dinkes ? (dinkes.id || dinkes.opdId || '') : (opds[0]?.id || opds[0]?.opdId || '')
      }

      // Check existing SOPs
      const pjPenyusunApi = await playwrightRequest.newContext({ baseURL: apiBaseURL })
      const loginPenyusun = await pjPenyusunApi.post(`${apiBaseURL}/auth/login`, {
        data: { email: users.pjPenyusun.email, password: users.pjPenyusun.password },
      })
      const penyusunCookie = loginPenyusun.headersArray().find((h) => h.name.toLowerCase() === 'set-cookie')?.value.split(';')[0] || ''
      const penyusunAuthedApi = await playwrightRequest.newContext({
        baseURL: apiBaseURL,
        extraHTTPHeaders: { cookie: penyusunCookie },
      })

      const sopsRes = await penyusunAuthedApi.get(`${apiBaseURL}/sop`)
      if (sopsRes.ok()) {
        const sopsJson = await sopsRes.json()
        const sops = sopsJson.data || sopsJson || []
        if (sops.length > 0) {
          sampleSopId = sops[0].sopId || sops[0].id || ''
          sampleDetailSopId = sops[0].detailSopId || sops[0].activeDetailId || ''
        }
      }

      if (!sampleSopId) {
        const created = await createReadySopFixture(penyusunAuthedApi, 'SOP-SCREENSHOT')
        sampleSopId = created.sopId
        sampleDetailSopId = created.detailSopId
      }

      // Check existing Pengajuan Evaluasi
      const evalRes = await pjAuthedApi.get(`${apiBaseURL}/evaluasi`)
      if (evalRes.ok()) {
        const evalJson = await evalRes.json()
        const evals = evalJson.data || evalJson || []
        if (evals.length > 0) {
          activePengajuanId = evals[0].id || evals[0].pengajuanEvaluasiId || ''
        }
      }

      await pjEvaluatorApi.dispose()
      await pjAuthedApi.dispose()
      await pjPenyusunApi.dispose()
      await penyusunAuthedApi.dispose()
    } catch (err) {
      console.warn('Init seed data notice:', err)
    }
  })

  test('01 - Capture Halaman Publik', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      // 01_beranda
      await page.goto('/')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '01_publik', '01_beranda.png'),
        fullPage: true,
      })

      // 02_katalog_arsip_sop
      await page.goto('/arsip')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '01_publik', '02_katalog_arsip_sop.png'),
        fullPage: true,
      })

      // 03_katalog_arsip_opd
      if (dinkesOpdId) {
        await page.goto(`/arsip/${dinkesOpdId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(600)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '01_publik', '03_katalog_arsip_opd.png'),
          fullPage: true,
        })
      }

      // 04_detail_arsip_sop
      if (dinkesOpdId && sampleDetailSopId) {
        await page.goto(`/arsip/${dinkesOpdId}/${sampleDetailSopId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(1000)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '01_publik', '04_detail_arsip_sop.png'),
          fullPage: true,
        })
      }

      // 05_validasi_dokumen_pdf_tte
      await page.goto('/validasi/pdf')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '01_publik', '05_validasi_dokumen_pdf_tte.png'),
        fullPage: true,
      })

      // 06_halaman_login
      await page.goto('/login')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '01_publik', '06_halaman_login.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })

  test('02 - Capture PJ Evaluator Views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      await loginAs(page, users.pjEvaluator)

      // 01_dashboard_grafik_evaluasi
      await page.goto('/pj-evaluator/grafik-evaluasi')
      await waitForAppReady(page)
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '01_dashboard_grafik_evaluasi.png'),
        fullPage: true,
      })

      // 02_manajemen_master_opd
      await page.goto('/pj-evaluator/opd')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '02_manajemen_master_opd.png'),
        fullPage: true,
      })

      // 03_modal_tambah_opd
      const btnTambahOpd = page.getByRole('button', { name: /tambah opd/i })
      if (await btnTambahOpd.isVisible().catch(() => false)) {
        await btnTambahOpd.click()
        await page.waitForTimeout(400)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '02_pj_evaluator', '03_modal_tambah_opd.png'),
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // 04_manajemen_pengguna_penyusun
      await page.goto('/pj-evaluator/penyusun')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '04_manajemen_pengguna_penyusun.png'),
        fullPage: true,
      })

      // 05_modal_tambah_penyusun
      const btnTambahPenyusun = page.getByRole('button', { name: /tambah penyusun/i })
      if (await btnTambahPenyusun.isVisible().catch(() => false)) {
        await btnTambahPenyusun.click()
        await page.waitForTimeout(400)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '02_pj_evaluator', '05_modal_tambah_penyusun.png'),
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // 06_manajemen_tim_evaluator
      await page.goto('/pj-evaluator/evaluator')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '06_manajemen_tim_evaluator.png'),
        fullPage: true,
      })

      // 07_modal_tambah_evaluator
      const btnTambahEvaluator = page.getByRole('button', { name: /tambah anggota|tambah evaluator/i })
      if (await btnTambahEvaluator.isVisible().catch(() => false)) {
        await btnTambahEvaluator.click()
        await page.waitForTimeout(400)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '02_pj_evaluator', '07_modal_tambah_evaluator.png'),
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // 08_daftar_pengajuan_evaluasi_masuk
      await page.goto('/pj-evaluator/evaluasi')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '08_daftar_pengajuan_evaluasi_masuk.png'),
        fullPage: true,
      })

      // 09_detail_monitoring_evaluasi_sop
      if (activePengajuanId) {
        await page.goto(`/pj-evaluator/evaluasi/${activePengajuanId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '02_pj_evaluator', '09_detail_monitoring_evaluasi_sop.png'),
          fullPage: true,
        })
      }

      // 10_profil_dan_keamanan_pj_evaluator
      await page.goto('/pj-evaluator/me')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '02_pj_evaluator', '10_profil_dan_keamanan_pj_evaluator.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })

  test('03 - Capture Evaluator Views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      await loginAs(page, users.evaluator)

      // 01_daftar_penugasan_evaluasi
      await page.goto('/evaluator/evaluasi')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '03_evaluator', '01_daftar_penugasan_evaluasi.png'),
        fullPage: true,
      })

      // 02_lembar_penilaian_evaluasi_sop
      if (activePengajuanId) {
        await page.goto(`/evaluator/evaluasi/pengajuan/${activePengajuanId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '03_evaluator', '02_lembar_penilaian_evaluasi_sop.png'),
          fullPage: true,
        })
      }

      // 03_profil_evaluator
      await page.goto('/evaluator/me')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '03_evaluator', '03_profil_evaluator.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })

  test('04 - Capture PJ Penyusun Views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      await loginAs(page, users.pjPenyusun)

      // 01_daftar_katalog_sop_opd
      await page.goto('/penyusun/sop')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '04_pj_penyusun', '01_daftar_katalog_sop_opd.png'),
        fullPage: true,
      })

      // Detail SOP View & Tabs
      if (sampleSopId) {
        await page.goto(`/penyusun/sop/${sampleSopId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(1000)

        // 02_detail_sop_editor_preview
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '04_pj_penyusun', '02_detail_sop_editor_preview.png'),
          fullPage: true,
        })

        // 03_detail_sop_editor_langkah_prosedur
        const btnEditManual = page.getByRole('button', { name: /edit manual|langkah/i }).first()
        if (await btnEditManual.isVisible().catch(() => false)) {
          await btnEditManual.click()
          await page.waitForTimeout(600)
          await page.screenshot({
            path: path.join(screenshotsBaseDir, '04_pj_penyusun', '03_detail_sop_editor_langkah_prosedur.png'),
            fullPage: true,
          })
        }

        // 04_detail_sop_visualisasi_flowchart
        const btnFlowchart = page.getByRole('button', { name: /flowchart/i }).first()
        if (await btnFlowchart.isVisible().catch(() => false)) {
          await btnFlowchart.click()
          await page.waitForTimeout(600)
          await page.screenshot({
            path: path.join(screenshotsBaseDir, '04_pj_penyusun', '04_detail_sop_visualisasi_flowchart.png'),
            fullPage: true,
          })
        }

        // 05_detail_sop_panel_riwayat_versi
        const tabVersi = page.getByRole('button', { name: /versi/i }).first()
        if (await tabVersi.isVisible().catch(() => false)) {
          await tabVersi.click()
          await page.waitForTimeout(500)
          await page.screenshot({
            path: path.join(screenshotsBaseDir, '04_pj_penyusun', '05_detail_sop_panel_riwayat_versi.png'),
            fullPage: true,
          })
        }

        // 06_detail_sop_panel_aktivitas
        const tabAktivitas = page.getByRole('button', { name: /aktivitas/i }).first()
        if (await tabAktivitas.isVisible().catch(() => false)) {
          await tabAktivitas.click()
          await page.waitForTimeout(500)
          await page.screenshot({
            path: path.join(screenshotsBaseDir, '04_pj_penyusun', '06_detail_sop_panel_aktivitas.png'),
            fullPage: true,
          })
        }
      }

      // 07_master_data_pelaksana_sop
      await page.goto('/penyusun/pelaksana')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '04_pj_penyusun', '07_master_data_pelaksana_sop.png'),
        fullPage: true,
      })

      // 08_modal_tambah_pelaksana
      const btnTambahPelaksana = page.getByRole('button', { name: /tambah pelaksana/i })
      if (await btnTambahPelaksana.isVisible().catch(() => false)) {
        await btnTambahPelaksana.click()
        await page.waitForTimeout(400)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '04_pj_penyusun', '08_modal_tambah_pelaksana.png'),
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // 09_master_data_dasar_hukum_peraturan
      await page.goto('/penyusun/peraturan')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '04_pj_penyusun', '09_master_data_dasar_hukum_peraturan.png'),
        fullPage: true,
      })

      // 10_modal_tambah_peraturan
      const btnTambahPeraturan = page.getByRole('button', { name: /tambah peraturan/i })
      if (await btnTambahPeraturan.isVisible().catch(() => false)) {
        await btnTambahPeraturan.click()
        await page.waitForTimeout(400)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '04_pj_penyusun', '10_modal_tambah_peraturan.png'),
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }

      // 11_daftar_berita_acara_evaluasi
      await page.goto('/penyusun/pj-penyusun/berita-acara')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '04_pj_penyusun', '11_daftar_berita_acara_evaluasi.png'),
        fullPage: true,
      })

      // 12_detail_berita_acara_evaluasi
      if (activePengajuanId) {
        await page.goto(`/penyusun/pj-penyusun/berita-acara/${activePengajuanId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '04_pj_penyusun', '12_detail_berita_acara_evaluasi.png'),
          fullPage: true,
        })
      }

      // 13_profil_dan_sertifikat_tte_pj_penyusun
      await page.goto('/penyusun/me')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '04_pj_penyusun', '13_profil_dan_sertifikat_tte_pj_penyusun.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })

  test('05 - Capture Penyusun Views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      await loginAs(page, users.penyusun)

      // 01_daftar_sop_penyusunan
      await page.goto('/penyusun/sop')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '05_penyusun', '01_daftar_sop_penyusunan.png'),
        fullPage: true,
      })

      // 02_master_pelaksana_penyusun
      await page.goto('/penyusun/pelaksana')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '05_penyusun', '02_master_pelaksana_penyusun.png'),
        fullPage: true,
      })

      // 03_master_peraturan_penyusun
      await page.goto('/penyusun/peraturan')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '05_penyusun', '03_master_peraturan_penyusun.png'),
        fullPage: true,
      })

      // 04_profil_penyusun
      await page.goto('/penyusun/me')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '05_penyusun', '04_profil_penyusun.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })

  test('06 - Capture Kepala OPD Views', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    })
    const page = await context.newPage()

    try {
      await loginAs(page, users.kepalaOpd)

      // 01_pantau_sop_opd
      await page.goto('/kepala-opd/sop')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '06_kepala_opd', '01_pantau_sop_opd.png'),
        fullPage: true,
      })

      // 02_detail_pantau_sop_kepala_opd
      if (sampleSopId) {
        await page.goto(`/kepala-opd/sop/${sampleSopId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '06_kepala_opd', '02_detail_pantau_sop_kepala_opd.png'),
          fullPage: true,
        })
      }

      // 03_daftar_pengajuan_pengesahan
      await page.goto('/kepala-opd/pengajuan')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '06_kepala_opd', '03_daftar_pengajuan_pengesahan.png'),
        fullPage: true,
      })

      // 04_detail_pengesahan_sop_dan_tte
      if (activePengajuanId) {
        await page.goto(`/kepala-opd/pengajuan/${activePengajuanId}`)
        await waitForAppReady(page)
        await page.waitForTimeout(800)
        await page.screenshot({
          path: path.join(screenshotsBaseDir, '06_kepala_opd', '04_detail_pengesahan_sop_dan_tte.png'),
          fullPage: true,
        })
      }

      // 05_profil_dan_manajemen_tte_kepala_opd
      await page.goto('/kepala-opd/me')
      await waitForAppReady(page)
      await page.waitForTimeout(600)
      await page.screenshot({
        path: path.join(screenshotsBaseDir, '06_kepala_opd', '05_profil_dan_manajemen_tte_kepala_opd.png'),
        fullPage: true,
      })
    } finally {
      await context.close()
    }
  })
})
