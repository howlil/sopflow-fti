import type { PaginationMetaDto } from '@/types/dto/common.dto'
import type { LangkahSOP, PenyusunWorkbenchData, SopDetail } from '@/types/dto/sop.dto'

export interface PublicArsipQueryParams {
  page?: number
  limit?: number
  search?: string
}

export type PublicLingkupOrganisasi = 'FACULTY' | 'DEPARTMENT'

export interface PublicProsesBisnisItem {
  prosesBisnisId: string
  nama: string
  scope: PublicLingkupOrganisasi
  departemenId: string | null
  namaDepartemen: string | null
  jumlahSopBerlaku: number
}

export interface PublicSopItem {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  tanggalEfektif: string | null
  prosesBisnisId: string
  namaProsesBisnis: string
  scope: PublicLingkupOrganisasi
  departemenId: string | null
  namaDepartemen: string | null
  pdfUrl: string
}

export interface PublicProsesBisnisPage {
  items: PublicProsesBisnisItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopPage {
  items: PublicSopItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopByProsesBisnisPage extends PublicSopPage {
  process: PublicProsesBisnisItem
}

export interface PublicSopDokumen {
  detail: SopDetail
  langkah: LangkahSOP[]
  diagramKonfigurasi?: PenyusunWorkbenchData['diagramKonfigurasi']
}

export type PublicSopDokumenWorkbench = PenyusunWorkbenchData
