import type { APIRequestContext } from '@playwright/test'

import { targetUsers, type E2eUser } from '../fixtures/users'
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

export interface ProcessSopSeedOptions {
  actor?: E2eUser
  processName?: string
  institutionName?: string
}

async function resolveProcess(
  context: APIRequestContext,
  processName: string,
): Promise<ProcessContextRow> {
  const processes = await apiGet<ProcessContextRow[]>(context, '/process-context/mine')
  const process = processes.find((row) => row.nama === processName)
  if (!process) {
    throw new Error(`Target E2E Process tidak tersedia untuk identity ini: ${processName}`)
  }
  return process
}

/**
 * Membentuk satu SOP Process yang lengkap tetapi tetap DRAFT.
 *
 * Semua mutation di sini adalah PRECONDITION. Aksi workflow yang menjadi objek journey
 * tetap dilakukan melalui browser. Related SOP sengaja memakai compatibility authoring
 * endpoint agar hanya subject Process-bound row yang masuk target work queue.
 */
export async function seedReadyProcessSop(
  apiFor: RoleApiFactory,
  prefix = 'FTI-PROCESS',
  options: ProcessSopSeedOptions = {},
): Promise<ReadyProcessSopFixture> {
  const actor = options.actor ?? targetUsers.processMember
  const processName = options.processName ?? 'Pengelolaan Akademik FTI'
  const institutionName = options.institutionName ?? 'Fakultas Teknologi Informasi'
  const memberApi = await apiFor(actor)
  const process = await resolveProcess(memberApi, processName)
  const fixture = sopFixture(prefix)
  const relatedFixture = sopFixture(`${prefix}-REL`)

  const pelaksana = await apiPost<Pelaksana>(memberApi, '/pelaksana', {
    namaPelaksana: `P-${fixture.suffix.slice(-12)}`,
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
    namaLembaga: institutionName,
  })
  const sop = await apiPost<SopRow>(memberApi, '/process-sop', {
    processId: process.processId,
    judul: fixture.title,
    nomorSop: fixture.number,
    namaLembaga: institutionName,
  })

  await apiPatch<Workbench>(memberApi, `/process-sop/header/${sop.detailSopId}`, {
    namaLembaga: institutionName,
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
    throw new Error(`Precondition Process SOP harus tetap DRAFT, ditemukan ${workbench.detail.status}`)
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
