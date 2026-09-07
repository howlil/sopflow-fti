import type { APIRequestContext } from '@playwright/test'

import { targetUsers, type E2eUser } from '../fixtures/users'
import type { RoleApiFactory } from '../fixtures/business-test'
import { apiGet, apiPatch, apiPost } from './api'
import { sopFixture } from './test-data'

interface ProsesBisnisContextRow {
  prosesBisnisId: string
  nama: string
  penanggungJawabId: string
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

export interface ReadyProsesBisnisSopFixture {
  title: string
  number: string
  sopId: string
  detailSopId: string
  prosesBisnisId: string
  namaProsesBisnis: string
}

export interface ProsesBisnisSopSeedOptions {
  actor?: E2eUser
  namaProsesBisnis?: string
  institutionName?: string
}

async function resolveProsesBisnis(
  context: APIRequestContext,
  namaProsesBisnis: string,
): Promise<ProsesBisnisContextRow> {
  const prosesBisnis = await apiGet<ProsesBisnisContextRow[]>(context, '/konteks-proses-bisnis/mine')
  const process = prosesBisnis.find((row) => row.nama === namaProsesBisnis)
  if (!process) {
    throw new Error(`Target E2E ProsesBisnis tidak tersedia untuk identity ini: ${namaProsesBisnis}`)
  }
  return process
}

/**
 * Membentuk satu SOP ProsesBisnis yang lengkap tetapi tetap DRAFT.
 *
 * Semua mutation di sini adalah PRECONDITION. Aksi workflow yang menjadi objek journey
 * tetap dilakukan melalui browser. Related SOP sengaja memakai compatibility authoring
 * endpoint agar hanya subject ProsesBisnis-bound row yang masuk target work queue.
 */
export async function seedReadyProsesBisnisSop(
  apiFor: RoleApiFactory,
  prefix = 'FTI-PROCESS',
  options: ProsesBisnisSopSeedOptions = {},
): Promise<ReadyProsesBisnisSopFixture> {
  const actor = options.actor ?? targetUsers.anggotaProsesBisnis
  const namaProsesBisnis = options.namaProsesBisnis ?? 'Pengelolaan Akademik FTI'
  const institutionName = options.institutionName ?? 'Fakultas Teknologi Informasi'
  const memberApi = await apiFor(actor)
  const process = await resolveProsesBisnis(memberApi, namaProsesBisnis)
  const fixture = sopFixture(prefix)
  const relatedFixture = sopFixture(`${prefix}-REL`)

  const pelaksana = await apiPost<Pelaksana>(memberApi, '/pelaksana', {
    namaPelaksana: `P-${fixture.suffix.slice(-12)}`,
  })
  const peraturan = await apiPost<Peraturan>(memberApi, '/peraturan', {
    namaPeraturan: `Peraturan FTI E2E ${fixture.suffix}`,
    nomor: `FTI-${fixture.suffix}`,
    tahun: 2026,
    tentang: `Dasar hukum ProsesBisnis E2E ${fixture.suffix}`,
  })
  const relatedSop = await apiPost<SopRow>(memberApi, '/sop', {
    judul: relatedFixture.title,
    nomorSop: relatedFixture.number,
    namaLembaga: institutionName,
  })
  const sop = await apiPost<SopRow>(memberApi, '/sop-proses-bisnis', {
    prosesBisnisId: process.prosesBisnisId,
    judul: fixture.title,
    nomorSop: fixture.number,
    namaLembaga: institutionName,
  })

  await apiPatch<Workbench>(memberApi, `/sop-proses-bisnis/header/${sop.detailSopId}`, {
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
    `/sop-proses-bisnis/workbench/${sop.detailSopId}`,
  )
  if (workbench.detail.status !== 'DRAFT') {
    throw new Error(`Precondition ProsesBisnis SOP harus tetap DRAFT, ditemukan ${workbench.detail.status}`)
  }

  return {
    title: fixture.title,
    number: fixture.number,
    sopId: sop.id,
    detailSopId: sop.detailSopId,
    prosesBisnisId: process.prosesBisnisId,
    namaProsesBisnis: process.nama,
  }
}
