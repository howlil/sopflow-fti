import {
  displayHasilEvaluasi,
  displayStatusPengajuan,
  displayStatusSop,
  displayStatusTindakLanjut,
} from '../../../common/status/status-display';
import { PeranPengguna, StatusPengajuanEvaluasi } from '../../../generated/prisma';
import { encodeLogNilaiEvaluasiClientId } from '../nilai/log-nilai-evaluasi-client-id';
import { buildNilaiEvaluasiClientId } from '../nilai/nilai-evaluasi-client-id';
import type { PengajuanEvaluasiResponseDto } from './dto/pengajuan-evaluasi-response.dto';
import type { PengajuanEvaluasiDetailRow } from './pengajuan-evaluasi.repository';

const STATUS_PENGAJUAN_SUDAH_DIVERIFIKASI = new Set<StatusPengajuanEvaluasi>([
  StatusPengajuanEvaluasi.DITANDATANGANI_PJ_EVALUATOR,
  StatusPengajuanEvaluasi.DITANDATANGANI_PJ_PENYUSUN,
  StatusPengajuanEvaluasi.SELESAI,
]);

/** Muatan data selaras kebutuhan klien (`PengajuanEvaluasi` di `evaluasi.dto.ts`). */
export type PengajuanEvaluasiApiPayload = PengajuanEvaluasiResponseDto;

export function shouldOmitOpdFieldsForViewer(viewerPeran?: string): boolean {
  return viewerPeran === PeranPengguna.PJ_PENYUSUN;
}

export function mapPengajuanEvaluasiRow(
  row: PengajuanEvaluasiDetailRow,
  viewerPeran?: string,
): PengajuanEvaluasiApiPayload {
  const dokBa = row.dokumenTte[0];
  const nomorBA =
    row.nomorBA ?? (dokBa !== undefined && dokBa !== null ? dokBa.nomorDokumen : undefined);
  const sopList = row.nilaiEvaluasi.map((nilai) => {
    const statusDisplay = displayStatusSop(nilai.detailSop.status);
    const hasilDisplay = displayHasilEvaluasi(nilai.hasil);
    return {
      id: buildNilaiEvaluasiClientId(row.pengajuanEvaluasiId, nilai.detailSopId),
      sopDetailId: nilai.detailSopId,
      judul: nilai.detailSop.sop.judul,
      nomor: nilai.detailSop.nomorSOP,
      nama: nilai.detailSop.sop.judul,
      nomorSOP: nilai.detailSop.nomorSOP,
      status: statusDisplay.value,
      statusLabel: statusDisplay.label,
      hasil: hasilDisplay.value,
      hasilLabel: hasilDisplay.label,
    };
  });
  const nilaiEvaluasi = row.nilaiEvaluasi.map((nilai) => {
    const tindakDisplay = displayStatusTindakLanjut(nilai.statusTindakLanjut);
    return {
      id: buildNilaiEvaluasiClientId(row.pengajuanEvaluasiId, nilai.detailSopId),
      pengajuanEvaluasiId: row.pengajuanEvaluasiId,
      sopDetailId: nilai.detailSopId,
      hasil: displayHasilEvaluasi(nilai.hasil).value,
      catatan: nilai.catatan ?? undefined,
      statusTindakLanjut: tindakDisplay?.value,
      statusTindakLanjutLabel: tindakDisplay?.label,
      ditindaklanjutiPada: nilai.ditindaklanjutiPada?.toISOString(),
      version: nilai.version,
      dinilaiOlehId: nilai.dinilaiOlehId ?? undefined,
      dinilaiOleh:
        nilai.dinilaiOleh !== null && nilai.dinilaiOleh !== undefined
          ? { id: nilai.dinilaiOleh.penggunaId, nama: nilai.dinilaiOleh.nama }
          : undefined,
      sopDetail: { id: nilai.detailSopId },
      createdAt: nilai.createdAt.toISOString(),
      updatedAt: nilai.updatedAt.toISOString(),
    };
  });
  const riwayatEvaluasi = row.logNilaiEvaluasi.map((log) => ({
    id: encodeLogNilaiEvaluasiClientId(
      log.pengajuanEvaluasiId,
      log.detailSopId,
      log.penggunaId,
      log.createdAt,
    ),
    sopDetailId: log.detailSopId,
    evaluatorId: log.penggunaId,
    evaluatorNama: log.pengguna.nama,
    hasilSebelum:
      log.hasilSebelum === null || log.hasilSebelum === undefined
        ? undefined
        : displayHasilEvaluasi(log.hasilSebelum).value,
    hasilSesudah:
      log.hasilSesudah === null || log.hasilSesudah === undefined
        ? undefined
        : displayHasilEvaluasi(log.hasilSesudah).value,
    catatanSebelum: log.catatanSebelum ?? undefined,
    catatanSesudah: log.catatanSesudah ?? undefined,
    createdAt: log.createdAt.toISOString(),
  }));
  const tanggalVerifikasi = STATUS_PENGAJUAN_SUDAH_DIVERIFIKASI.has(row.status)
    ? row.updatedAt.toISOString()
    : undefined;
  const statusDisplay = displayStatusPengajuan(row.status);
  const omitOpdFields = shouldOmitOpdFieldsForViewer(viewerPeran);
  const payload: PengajuanEvaluasiApiPayload = {
    id: row.pengajuanEvaluasiId,
    jenis: String(row.jenis),
    status: statusDisplay.value,
    statusLabel: statusDisplay.label,
    nomorBA,
    tanggalPermintaan: row.tanggalPermintaan?.toISOString(),
    tanggalEvaluasi: row.tanggalEvaluasi?.toISOString(),
    tanggalVerifikasi,
    namaBiro: undefined,
    diverifikasiOlehUserId: row.diverifikasiOlehUserId ?? undefined,
    namaPjEvaluator: row.diverifikasiOlehUser?.nama ?? row.diselesaikanOleh?.nama ?? undefined,
    ditandatanganiOlehPjPenyusunUserId: row.ditandatanganiOlehPjPenyusunUserId ?? undefined,
    namaPjPenyusun: row.ditandatanganiOlehPjPenyusunUser?.nama ?? undefined,
    tanggalTTDBaPjPenyusun: row.tanggalTTDBaPjPenyusun?.toISOString(),
    diselesaikanOlehId: row.diselesaikanOlehId ?? undefined,
    diselesaikanOleh:
      row.diselesaikanOleh !== null && row.diselesaikanOleh !== undefined
        ? { id: row.diselesaikanOleh.penggunaId, nama: row.diselesaikanOleh.nama }
        : undefined,
    timEvaluasi: row.diselesaikanOleh?.nama ?? '',
    tanggalDiselesaikan: row.tanggalDiselesaikan?.toISOString(),
    alasanPenolakan: row.alasanPenolakan ?? undefined,
    tanggalDitolak: row.tanggalDitolak?.toISOString(),
    ditolakOlehId: row.ditolakOlehId ?? undefined,
    ditolakOleh:
      row.ditolakOleh !== null && row.ditolakOleh !== undefined
        ? { id: row.ditolakOleh.penggunaId, nama: row.ditolakOleh.nama }
        : undefined,
    sopList,
    nilaiEvaluasi,
    riwayatEvaluasi,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if (!omitOpdFields) {
    payload.opdId = row.opdId;
    payload.opdNama = row.opd.nama;
    payload.nilaiOPD = row.nilaiOPD ?? undefined;
    payload.opd = { id: row.opd.opdId, nama: row.opd.nama };
  }
  return payload;
}
