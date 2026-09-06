import { displayStatusSop } from '../../../common/status/status-display';
import {
  hasRevisiInFlight,
  TERMINAL_DETAIL_STATUSES,
} from '../../../common/status/sop-editable.util';
import { StatusSOP } from '../../../generated/prisma';
import { encodeLogEditSopClientId } from '../collaboration/log-edit-session.helper';
import { mapDiagramConfigsToWorkbenchDto } from '../diagram/diagram-workbench.mapper';
import type { PenyusunWorkbenchDataDto } from './dto/penyusun-workbench-data.dto';
import type { SopDaftarRowDto } from './dto/sop-daftar-row.dto';
import type { SopDaftarVersiSliceDto } from './dto/sop-daftar-versi-slice.dto';
import type { SopDaftarDbRow, SopWorkbenchDbPayload } from './sop-catalog.repository';

type TteSignaturePayloadDto = {
  id: string;
  dokumenTteId: string;
  userId: string;
  nip: string;
  namaLengkap: string;
  jabatan: string;
  signedAt: string;
};

export function toIso(d: Date): string {
  return d.toISOString();
}

export function mapWorkbenchPayload(row: SopWorkbenchDbPayload): PenyusunWorkbenchDataDto {
  const detailId = row.detailSopId;
  const sopHeader = {
    id: row.sop.sopId,
    processId: row.sop.processId,
    judul: row.sop.judul,
    createdAt: toIso(row.sop.createdAt),
    updatedAt: toIso(row.sop.updatedAt),
  };

  const peringatanSorted = [...row.lampiranPeringatan].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const lampiran = {
    peringatan: peringatanSorted.map((item) => ({
      id: item.lampiranPeringatanId,
      teks: item.teks,
      createdAt: toIso(item.createdAt),
    })),
    kualifikasiPelaksanaan: [...row.lampiranKualifikasiPelaksanaan]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ({
        id: item.lampiranKualifikasiPelaksanaanId,
        teks: item.teks,
        createdAt: toIso(item.createdAt),
      })),
    peralatanPerlengkapan: [...row.lampiranPeralatanPerlengkapan]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ({
        id: item.lampiranPeralatanPerlengkapanId,
        teks: item.teks,
        createdAt: toIso(item.createdAt),
      })),
    pencatatanPendataan: [...row.lampiranPencatatanPendataan]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ({
        id: item.lampiranPencatatanPendataanId,
        teks: item.teks,
        createdAt: toIso(item.createdAt),
      })),
  };

  const dasarHukumSorted = [...row.dasarHukum].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const dasarHukum = dasarHukumSorted.map((item) => ({
    id: `${detailId}-${item.peraturanId}`,
    sopDetailId: detailId,
    peraturanId: item.peraturanId,
    judul: item.peraturan.tentang,
    nomor: String(item.peraturan.nomor),
    tahun: String(item.peraturan.tahun),
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt),
  }));
  const dasarHukumPeraturanIds = dasarHukumSorted.map((item) => item.peraturanId);

  const relasiSopKeluarSorted = [...row.relasiSopKeluar].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const relasiSopKeluar = relasiSopKeluarSorted.map((rel) => ({
    id: `${rel.detailSopId}-${rel.detailSopTerkaitId}`,
    sopDetailId: rel.detailSopId,
    sopTerkaitId: rel.detailSopTerkaitId,
    createdAt: toIso(rel.createdAt),
    updatedAt: toIso(rel.updatedAt),
    sopTerkait: {
      id: rel.sopTerkait.detailSopId,
      sopId: rel.sopTerkait.sopId,
      nomorSOP: rel.sopTerkait.nomorSOP,
      sop: { judul: rel.sopTerkait.sop.judul },
    },
  }));
  const sopTerkaitDetailIds = relasiSopKeluarSorted.map((rel) => rel.detailSopTerkaitId);
  const relasiSopMasuk = row.relasiSopMasuk.map((rel) => ({
    id: `${rel.detailSopId}-${rel.detailSopTerkaitId}`,
    sopDetailId: rel.detailSopTerkaitId,
    sopTerkaitId: rel.detailSopId,
    createdAt: toIso(rel.createdAt),
    updatedAt: toIso(rel.updatedAt),
    sop: {
      id: rel.sop.detailSopId,
      sopId: rel.sop.sopId,
      nomorSOP: rel.sop.nomorSOP,
      sop: { judul: rel.sop.sop.judul },
    },
  }));

  const swimlanes = row.swimlanes.map((swimlane) => ({
    id: `${swimlane.detailSopId}-${swimlane.pelaksanaId}`,
    sopDetailId: swimlane.detailSopId,
    pelaksanaId: swimlane.pelaksanaId,
    urutan: swimlane.urutan,
    createdAt: toIso(swimlane.createdAt),
    updatedAt: toIso(swimlane.updatedAt),
    pelaksana: {
      id: swimlane.pelaksana.pelaksanaId,
      namaPelaksana: swimlane.pelaksana.nama,
    },
  }));

  const statusDisplay = displayStatusSop(row.status);
  const detail: PenyusunWorkbenchDataDto['detail'] = {
    id: detailId,
    sopId: row.sopId,
    status: statusDisplay.value,
    statusLabel: statusDisplay.label,
    versi: row.versi,
    revisiDariDetailSopId: row.revisiDariDetailSopId,
    revisiDariVersi: row.revisiDari?.versi ?? null,
    nomorSOP: row.nomorSOP,
    tanggalPembuatan: toIso(row.tanggalPembuatan),
    tanggalRevisi: row.tanggalRevisi === null ? null : toIso(row.tanggalRevisi),
    tanggalEfektif: row.tanggalEfektif === null ? null : toIso(row.tanggalEfektif),
    logoInstansi: '',
    namaLembaga: row.namaLembaga,
    dibuatOlehId: row.dibuatOlehId,
    terakhirDieditOlehId: row.terakhirDieditOlehId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    sop: sopHeader,
    dibuatOleh:
      row.dibuatOleh === null
        ? undefined
        : { id: row.dibuatOleh.penggunaId, nama: row.dibuatOleh.nama },
    terakhirDieditOleh:
      row.terakhirDieditOleh === null
        ? undefined
        : { id: row.terakhirDieditOleh.penggunaId, nama: row.terakhirDieditOleh.nama },
    lampiran,
    dasarHukum,
    relasiSopKeluar,
    relasiSopMasuk,
    swimlanes,
    signingAuthority: null,
    dasarHukumPeraturanIds,
    sopTerkaitDetailIds,
  };

  const langkah: PenyusunWorkbenchDataDto['langkah'] = row.langkahSOP.map((step) => ({
    id: step.langkahSopId,
    sopDetailId: step.detailSopId,
    urutan: step.urutan,
    kegiatan: step.kegiatan,
    jenis: String(step.jenis),
    kelengkapan: step.kelengkapan,
    keluaran: step.keluaran,
    waktu: step.waktu,
    satuanWaktu: String(step.satuanWaktu),
    keterangan: step.keterangan,
    pelaksanaId: step.pelaksanaId,
    langkahSelanjutnyaYaId: step.langkahSelanjutnyaYaId,
    langkahSelanjutnyaTidakId: step.langkahSelanjutnyaTidakId,
    createdAt: toIso(step.createdAt),
    updatedAt: toIso(step.updatedAt),
    pelaksana: {
      id: step.pelaksana.pelaksanaId,
      namaPelaksana: step.pelaksana.nama,
    },
  }));

  const logEdit: PenyusunWorkbenchDataDto['logEdit'] = row.logEditSop.map((log) => {
    const fields = log.domainFields.map((field) => field.domainField).sort();
    const count = log.sesiChangeCount;
    return {
      id: encodeLogEditSopClientId(log.detailSopId, log.penggunaId, log.createdAt),
      sopDetailId: log.detailSopId,
      userId: log.penggunaId,
      bagian: log.bagian,
      keterangan: log.keterangan ?? null,
      meta: fields.length === 0 && count === 0 ? null : { fields, count },
      aktorRole: '',
      createdAt: toIso(log.createdAt),
      closedAt: log.closedAt instanceof Date ? toIso(log.closedAt) : null,
      user: {
        id: log.pengguna.penggunaId,
        nama: log.pengguna.nama,
        email: log.pengguna.email,
      },
    };
  });

  let tteSignaturePayload: TteSignaturePayloadDto | undefined;
  const latestSignature = row.dokumenTte[0]?.riwayatTandaTangan[0];
  if (latestSignature?.user !== undefined) {
    tteSignaturePayload = {
      id: `${latestSignature.dokumenTteId}:${latestSignature.userId}`,
      dokumenTteId: latestSignature.dokumenTteId,
      userId: latestSignature.userId,
      nip: latestSignature.user.nip,
      namaLengkap: latestSignature.user.nama,
      jabatan: latestSignature.user.jabatan,
      signedAt: toIso(latestSignature.ditandatanganiPada),
    };
  }

  return {
    detail,
    langkah,
    logEdit,
    diagramKonfigurasi: mapDiagramConfigsToWorkbenchDto(row.konfigurasiDiagram),
    tteSignaturePayload,
  };
}

export function mapVersiSlice(slice: {
  detailSopId: string;
  versi: number;
  nomorSOP: string;
  status: string;
}): SopDaftarVersiSliceDto {
  const statusDisplay = displayStatusSop(slice.status);
  return {
    detailSopId: slice.detailSopId,
    versi: slice.versi,
    nomorSop: slice.nomorSOP,
    status: statusDisplay.value,
    statusLabel: statusDisplay.label,
  };
}

export function mapDaftarRow(row: SopDaftarDbRow): SopDaftarRowDto {
  const detail = row.detail;
  const inFlight = hasRevisiInFlight(row.allStatuses);
  const hasTerminalSource = row.allStatuses.some((status) => TERMINAL_DETAIL_STATUSES.has(status));
  const canBuatVersiBaru = hasTerminalSource && !inFlight;
  const canCabutSop =
    row.versiBerlaku !== null && row.versiBerlaku.status === StatusSOP.BERLAKU && !inFlight;
  const canHapusSopDraft =
    detail !== undefined &&
    detail.status === StatusSOP.DRAFT &&
    detail.versi === 1 &&
    row.allStatuses.length === 1;

  if (detail === undefined) {
    const statusDisplay = displayStatusSop(StatusSOP.DRAFT);
    return {
      id: row.sopId,
      detailSopId: null,
      judul: row.judul,
      nomorSop: null,
      versi: null,
      pembuat: null,
      terakhirDiedit: { nama: null, waktu: null },
      status: statusDisplay.value,
      statusLabel: statusDisplay.label,
      peraturanId: null,
      terakhirDiperbarui: null,
      versiBerlaku: null,
      canBuatVersiBaru: false,
      canCabutSop: false,
      canHapusSopDraft: false,
    };
  }

  const waktuIso = detail.updatedAt.toISOString();
  const statusDisplay = displayStatusSop(detail.status);
  return {
    id: row.sopId,
    detailSopId: detail.detailSopId,
    judul: row.judul,
    nomorSop: detail.nomorSOP,
    versi: detail.versi,
    pembuat: detail.pembuatNama,
    terakhirDiedit: { nama: detail.editorNama, waktu: waktuIso },
    status: statusDisplay.value,
    statusLabel: statusDisplay.label,
    peraturanId: detail.peraturanId,
    terakhirDiperbarui: waktuIso,
    versiBerlaku: row.versiBerlaku === null ? null : mapVersiSlice(row.versiBerlaku),
    canBuatVersiBaru,
    canCabutSop,
    canHapusSopDraft,
  };
}
