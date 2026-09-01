/** Satu baris payload GET `/evaluasi/ringkas`. */
export interface PengajuanEvaluasiRingkasResponseDto {
  pengajuanEvaluasiId: string;
  opdId: string;
  opdNama: string;
  jenis: string;
  status: string;
  statusLabel: string;
  tanggalEvaluasi?: string;
  createdAt: string;
  nilaiOPD?: number;
  jumlahSop: number;
  jumlahSudahDinilai: number;
}
