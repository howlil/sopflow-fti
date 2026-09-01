export interface PengajuanEvaluasiUserRingkasResponseDto {
  id: string;
  nama: string;
}

export interface PengajuanEvaluasiOpdResponseDto {
  id: string;
  nama: string;
}

export interface PengajuanEvaluasiSopItemResponseDto {
  id: string;
  sopDetailId: string;
  judul: string;
  nomor: string;
  nama: string;
  nomorSOP: string;
  status: string;
  statusLabel: string;
  hasil: string;
  hasilLabel: string;
}

export interface NilaiEvaluasiResponseDto {
  id: string;
  pengajuanEvaluasiId: string;
  sopDetailId: string;
  hasil: string;
  catatan?: string;
  statusTindakLanjut?: string;
  statusTindakLanjutLabel?: string;
  ditindaklanjutiPada?: string;
  version: number;
  dinilaiOlehId?: string;
  dinilaiOleh?: PengajuanEvaluasiUserRingkasResponseDto;
  sopDetail: { id: string };
  createdAt: string;
  updatedAt: string;
}

export interface RiwayatEvaluasiResponseDto {
  id: string;
  sopDetailId: string;
  evaluatorId: string;
  evaluatorNama: string;
  hasilSebelum?: string;
  hasilSesudah?: string;
  catatanSebelum?: string;
  catatanSesudah?: string;
  createdAt: string;
}

/** Muatan data GET/POST `/evaluasi` yang selaras kontrak frontend saat ini. */
export interface PengajuanEvaluasiResponseDto {
  id: string;
  opdId?: string;
  opdNama?: string;
  opd?: PengajuanEvaluasiOpdResponseDto;
  jenis: string;
  status: string;
  statusLabel: string;
  nomorBA?: string;
  tanggalPermintaan?: string;
  tanggalEvaluasi?: string;
  tanggalVerifikasi?: string;
  namaBiro?: string;
  diverifikasiOlehUserId?: string;
  namaPjEvaluator?: string;
  nilaiOPD?: number;
  ditandatanganiOlehPjPenyusunUserId?: string;
  namaPjPenyusun?: string;
  tanggalTTDBaPjPenyusun?: string;
  diselesaikanOlehId?: string;
  diselesaikanOleh?: PengajuanEvaluasiUserRingkasResponseDto;
  timEvaluasi: string;
  tanggalDiselesaikan?: string;
  alasanPenolakan?: string;
  tanggalDitolak?: string;
  ditolakOlehId?: string;
  ditolakOleh?: PengajuanEvaluasiUserRingkasResponseDto;
  sopList: PengajuanEvaluasiSopItemResponseDto[];
  nilaiEvaluasi: NilaiEvaluasiResponseDto[];
  riwayatEvaluasi: RiwayatEvaluasiResponseDto[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
