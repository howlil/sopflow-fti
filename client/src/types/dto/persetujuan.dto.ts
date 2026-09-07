import type { LingkupOrganisasi } from './proses-bisnis.dto'
import type { PenyusunWorkbenchData } from './sop.dto'

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

export interface PersetujuanAkhirSOPDto {
  detailSopId: string
  prosesBisnisId: string
  approvedById: string
  authority: PejabatBerwenang
  kunciPejabatBerwenang: string
  approvedAt: string
}

export interface ProsesBisnisApprovalQueueRowDto {
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
  approval: PersetujuanAkhirSOPDto | null
  updatedAt: string
}

export interface ProsesBisnisApprovalDocumentDto {
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
  status: 'DICABUT'
}
