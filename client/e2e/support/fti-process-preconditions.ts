import type { APIRequestContext } from '@playwright/test'

import { targetUsers } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPatch, apiPost } from './api'
import { sopFixture } from './test-data'

interface ProcessContextRow {
  processId: string
  nama: string
  ownerId: string
}

interface SopRow {
  id: string
  detailSopId: string
  judul: string
  nomorSop: string
  status: string
}

interface Pelaksana {
  id: string
}

interface Peraturan {
  id: string
}

interface Workbench {
  detail: {
    id: string
    sopId: string
    status: string
  }
}

export interface ReadyProcessSopFixture {
  title: string
  number: string
  sopId: string
  detailSopId: string
  processId: string
  processName: string
}

async function resolveFacultyProcess(context: APIRequestContext): Promise<ProcessContextRow> {
  const processes = await apiGet<ProcessContextRow[]>(context, '/process-context/mine')
  const process = processes.find((row) => row.nama === 'Pengelolaan Akademik FTI')
  if (!process) {
    throw new Error('Target E2E Faculty Process tidak tersedia')
  }
  return process
}

/**
 * Membentuk satu SOP Process yang lengkap tetapi tetap DRAFT.
 *
 * Semua mutation di sini adalah PRECONDITION. Aksi submit/review yang menjadi objek
 * J09 tetap dilakukan melalui browser. Related SOP sengaja memakai compatibility
 * authoring endpoint agar hanya satu Process-bound row muncul di target work queue.
 */
export async function seedReadyProcessSop(
  apiFor: RoleApiFactory,
  prefix = 'FTI-PROCESS',
): Promise<ReadyProcessSopFixture> {
  const memberApi = await apiFor(targetUsers.processMember)
  const process = await resolveFacultyProcess(memberApi)
  const fixture = sopFixture(prefix)
  const relatedFixture = sopFixture(`${prefix}-REL`)

  const pelaksana = await apiPost<Pelaksana>(memberApi, '/pelaksana', {
    namaPelaksana: `Pelaksana ${fixture.suffix}`,
  })
  const peraturan = await apiPost<Peraturan>(memberApi, '/peraturan', {
    namaPeraturan: `Peraturan FTI E2E ${fixture.suffix}`,
    nomor: `FTI-${fixture.suffix}`,
    tahun: 2026,
    tentang: `Dasar hukum Process E2E ${fixture.suffix}`,
  })
  const relatedSop = await apiPost<SopRow>(memberApi, '/sop', {
    judul: relatedFixture.title,
    nomorSop: relatedFixture.number,
    namaLembaga: 'Fakultas Teknologi Informasi',
  })
  const sop = await apiPost<SopRow>(memberApi, '/process-sop', {
    processId: process.processId,
    judul: fixture.title,
    nomorSop: fixture.number,
    namaLembaga: 'Fakultas Teknologi Informasi',
  })

  await apiPatch<Workbench>(memberApi, `/process-sop/header/${sop.detailSopId}`, {
    namaLembaga: 'Fakultas Teknologi Informasi',
    dasarHukumPeraturanIds: [peraturan.id],
    sopTerkaitDetailIds: [relatedSop.detailSopId],
    lampiran: {
      peringatan: ['Dokumen harus mengikuti standar SOP FTI.'],
      kualifikasiPelaksanaan: ['Memahami proses layanan FTI.'],
      peralatanPerlengkapan: ['Komputer dan jaringan.'],
      pencatatanPendataan: ['Arsip digital SOP FTI.'],
    },
  })

  await apiPatch<Workbench>(memberApi, `/sop/langkah/${sop.detailSopId}`, {
    pelaksana: [{ pelaksanaId: pelaksana.id }],
    langkah: [
      {
        tempId: `${fixture.suffix}-start`,
        jenis: 'AWAL_AKHIR',
        kegiatan: 'Mulai',
        kelengkapan: 'Berkas awal',
        keluaran: 'Dokumen diterima',
        keterangan: 'Awal prosedur',
        waktu: 5,
        satuanWaktu: 'm',
        pelaksanaId: pelaksana.id,
      },
      {
        tempId: `${fixture.suffix}-process`,
        jenis: 'KEGIATAN',
        kegiatan: 'Memeriksa kelengkapan dokumen',
        kelengkapan: 'Dokumen SOP',
        keluaran: 'Dokumen tervalidasi',
        keterangan: 'Pemeriksaan kelengkapan',
        waktu: 15,
        satuanWaktu: 'm',
        pelaksanaId: pelaksana.id,
      },
      {
        tempId: `${fixture.suffix}-end`,
        jenis: 'AWAL_AKHIR',
        kegiatan: 'Selesai',
        kelengkapan: 'Hasil pemeriksaan',
        keluaran: 'SOP siap diproses',
        keterangan: 'Akhir prosedur',
        waktu: 5,
        satuanWaktu: 'm',
        pelaksanaId: pelaksana.id,
      },
    ],
  })

  const workbench = await apiGet<Workbench>(
    memberApi,
    `/process-sop/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'DRAFT') {
    throw new Error(`Precondition J09 harus tetap DRAFT, ditemukan ${workbench.detail.status}`)
  }

  return {
    title: fixture.title,
    number: fixture.number,
    sopId: sop.id,
    detailSopId: sop.detailSopId,
    processId: process.processId,
    processName: process.nama,
  }
}
