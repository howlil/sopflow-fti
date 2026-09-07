import {
  JenisLangkahProsedur,
  SatuanWaktu,
  StatusSOP,
} from '../../../generated/prisma';
import type { SopWorkbenchDbPayload } from './sop-catalog.repository';
import { mapDaftarRow, mapWorkbenchPayload, toIso } from './sop-catalog.mapper';

describe('Pengujian SopCatalogMapper', () => {
  it('seharusnya memformat tanggal sebagai string ISO', () => {
    const d = new Date('2026-03-01T08:00:00.000Z');
    expect(toIso(d)).toBe('2026-03-01T08:00:00.000Z');
  });

  it('seharusnya memetakan workbench Process dengan keputusan langkah', () => {
    const t = new Date('2026-03-02T10:00:00.000Z');
    const row = {
      detailSopId: 'det-1',
      sopId: 'sop-1',
      status: StatusSOP.DRAFT,
      versi: 1,
      nomorSOP: '001/2026',
      tanggalPembuatan: t,
      tanggalRevisi: null,
      tanggalEfektif: null,
      namaLembaga: 'Fakultas Teknologi Informasi',
      dibuatOlehId: 'p1',
      terakhirDieditOlehId: null,
      revisiDariDetailSopId: null,
      revisiDari: null,
      createdAt: t,
      updatedAt: t,
      sop: {
        sopId: 'sop-1',
        processId: 'process-1',
        judul: 'Judul SOP',
        createdAt: t,
        updatedAt: t,
      },
      dibuatOleh: { penggunaId: 'p1', nama: 'Budi' },
      terakhirDieditOleh: null,
      lampiranPeringatan: [{ lampiranPeringatanId: 'lp1', teks: 'Awas', createdAt: t }],
      lampiranKualifikasiPelaksanaan: [],
      lampiranPeralatanPerlengkapan: [],
      lampiranPencatatanPendataan: [],
      dasarHukum: [
        {
          peraturanId: 'per-1',
          createdAt: t,
          updatedAt: t,
          peraturan: { tentang: 'UU X', nomor: '1', tahun: 2020 },
        },
      ],
      relasiSopKeluar: [],
      relasiSopMasuk: [],
      dokumenTte: [],
      swimlanes: [
        {
          detailSopId: 'det-1',
          pelaksanaId: 'pel-1',
          urutan: 1,
          createdAt: t,
          updatedAt: t,
          pelaksana: { pelaksanaId: 'pel-1', nama: 'Staf' },
        },
      ],
      langkahSOP: [
        {
          langkahSopId: 'lang-1',
          detailSopId: 'det-1',
          urutan: 1,
          kegiatan: 'Putuskan',
          jenis: JenisLangkahProsedur.KEPUTUSAN,
          kelengkapan: 'k',
          keluaran: 'o',
          waktu: 1,
          satuanWaktu: SatuanWaktu.m,
          keterangan: 'ket',
          pelaksanaId: 'pel-1',
          langkahSelanjutnyaYaId: 'lang-2',
          langkahSelanjutnyaTidakId: 'lang-3',
          createdAt: t,
          updatedAt: t,
          pelaksana: { pelaksanaId: 'pel-1', nama: 'Staf' },
        },
      ],
      logEditSop: [],
      konfigurasiDiagram: [],
    } as unknown as SopWorkbenchDbPayload;

    const actual = mapWorkbenchPayload(row);

    expect(actual.langkah[0]?.jenis).toBe(String(JenisLangkahProsedur.KEPUTUSAN));
    expect(actual.detail.dasarHukumPeraturanIds).toEqual(['per-1']);
    expect(actual.detail.sop).toMatchObject({
      id: 'sop-1',
      processId: 'process-1',
    });
  });

  it('seharusnya memetakan baris daftar dengan versi efektif', () => {
    const t = new Date('2026-01-15T10:00:00.000Z');
    const actual = mapDaftarRow({
      sopId: 'sop-1',
      judul: 'Judul',
      detail: {
        detailSopId: 'det-1',
        nomorSOP: '001',
        status: StatusSOP.EFFECTIVE,
        versi: 1,
        updatedAt: t,
        pembuatNama: 'Budi',
        editorNama: 'Ani',
        peraturanId: 'per-1',
      },
      versiBerlaku: {
        detailSopId: 'det-1',
        versi: 1,
        nomorSOP: '001',
        status: StatusSOP.EFFECTIVE,
        updatedAt: t,
        pembuatNama: 'Budi',
        editorNama: 'Ani',
        peraturanId: 'per-1',
      },
      allStatuses: [StatusSOP.EFFECTIVE],
    });

    expect(actual.canBuatVersiBaru).toBe(true);
    expect(actual.canCabutSop).toBe(true);
    expect(actual.canHapusSopDraft).toBe(false);
    expect(actual.versiBerlaku?.detailSopId).toBe('det-1');
  });

  it('seharusnya mengizinkan hapus SOP hanya untuk draft awal satu-satunya', () => {
    const t = new Date('2026-01-15T10:00:00.000Z');
    const actual = mapDaftarRow({
      sopId: 'sop-draft',
      judul: 'Draft awal',
      detail: {
        detailSopId: 'det-draft',
        nomorSOP: 'DRAFT-001',
        status: StatusSOP.DRAFT,
        versi: 1,
        updatedAt: t,
        pembuatNama: 'Budi',
        editorNama: 'Budi',
        peraturanId: null,
      },
      versiBerlaku: null,
      allStatuses: [StatusSOP.DRAFT],
    });

    expect(actual.canHapusSopDraft).toBe(true);
  });

  it('seharusnya mengizinkan versi baru dari SOP yang telah dicabut', () => {
    const t = new Date('2026-08-02T10:00:00.000Z');
    const actual = mapDaftarRow({
      sopId: 'sop-revoked',
      judul: 'SOP Dicabut',
      detail: {
        detailSopId: 'det-v1',
        nomorSOP: 'REV-001',
        status: StatusSOP.REVOKED,
        versi: 1,
        updatedAt: t,
        pembuatNama: 'Budi',
        editorNama: 'Budi',
        peraturanId: null,
      },
      versiBerlaku: null,
      allStatuses: [StatusSOP.REVOKED],
    });

    expect(actual.canBuatVersiBaru).toBe(true);
    expect(actual.canCabutSop).toBe(false);
  });
});
