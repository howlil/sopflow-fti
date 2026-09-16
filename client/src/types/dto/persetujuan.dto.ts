import type { LingkupOrganisasi } from './proses-bisnis.dto'
import type { PenyusunWorkbenchData } from './sop.dto'
import type { ProsesBisnisSopLifecycleProjection, StatusSOP } from './sop.dto'

export type PejabatBerwenang = 'DEAN' | 'HEAD_OF_DEPARTMENT'

export interface PenugasanPejabatBerwenangDto {
  kunciPejabatBerwenang: string
  authority: PejabatBerwenang
  departemenId: string | null
  holderId: string
  createdAt: string
  updatedAt: string
}

export interface PejabatBerwenangConfigurationDto extends PenugasanPejabatBerwenangDto {
  holder: {
    penggunaId: string
    nama: string
    email: string
    deletedAt: string | null
  } | null
  departemen: { departemenId: string; nama: string } | null
}

export interface ProsesBisnisTteDocumentDto {
  workbench: PenyusunWorkbenchData
  authority: {
    authority: PejabatBerwenang
    kunciPejabatBerwenang: string
    holderId: string
    holderName: string
    holderNip: string
    holderJabatan: string
  }
}

export interface ProsesBisnisLifecycleSopDto {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  status: StatusSOP
  statusLabel: string
  updatedAt: string
  siklus: ProsesBisnisSopLifecycleProjection
  prosesBisnisId?: string
  namaProsesBisnis?: string
}

export interface ProsesBisnisLifecycleGroupDto {
  prosesBisnisId: string
  namaProsesBisnis: string
  lingkup: LingkupOrganisasi
  departemenId: string | null
  departmentNama: string | null
  jumlahSop: number
  statusCounts: Record<string, number>
  sops: ProsesBisnisLifecycleSopDto[]
}

export interface ProsesBisnisTteQueueDto {
  pending: Array<ProsesBisnisLifecycleSopDto & { prosesBisnisId: string; namaProsesBisnis: string }>
  completed: Array<{
    dokumenTteId: string
    ditandatanganiPada: string
    authority: PejabatBerwenang
    dokumenTte: {
      detailSopId: string
      nomorDokumen: string
      judulDokumen: string
      prosesBisnisId: string
      detailSop: { sopId: string; versi: number; status: StatusSOP }
    }
  }>
}

export interface ProsesBisnisRevocationQueueRowDto {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  prosesBisnisId: string
  namaProsesBisnis: string
  lingkup: LingkupOrganisasi
  departemenId: string | null
  departmentNama: string | null
  updatedAt: string
}

export interface ProsesBisnisRevocationResultDto {
  detailSopId: string
  sopId: string
  prosesBisnisId: string
  status: 'REVOKED'
}

export type StatusPaketPemeriksaanProsesBisnis =
  | 'IN_REVIEW'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'

export interface PaketPemeriksaanProsesBisnisItemDto {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  status: StatusSOP
  statusLabel: string
  updatedAt: string
  catatanTerakhir: string | null
}

export interface PaketPemeriksaanProsesBisnisDto {
  paketPemeriksaanProsesBisnisId: string
  prosesBisnisId: string
  namaProsesBisnis: string
  penanggungJawabId: string
  status: StatusPaketPemeriksaanProsesBisnis
  diajukanPada: string
  selesaiPada: string | null
  totalSop: number
  menungguPemeriksaan: number
  disetujui: number
  perluPerbaikan: number
  items: PaketPemeriksaanProsesBisnisItemDto[]
}
