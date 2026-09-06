import type { PaginationMetaDto } from '@/types/dto/common.dto'
import type { LangkahSOP, PenyusunWorkbenchData, SopDetail } from '@/types/dto/sop.dto'

export interface PublicArsipQueryParams {
  page?: number
  limit?: number
  search?: string
}

export type PublicOrganizationalScope = 'FACULTY' | 'DEPARTMENT'

export interface PublicProcessItem {
  processId: string
  nama: string
  scope: PublicOrganizationalScope
  departmentId: string | null
  departmentName: string | null
  jumlahSopBerlaku: number
}

export interface PublicSopItem {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  tanggalEfektif: string | null
  processId: string
  processName: string
  scope: PublicOrganizationalScope
  departmentId: string | null
  departmentName: string | null
  pdfUrl: string
}

export interface PublicProcessPage {
  items: PublicProcessItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopPage {
  items: PublicSopItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopByProcessPage extends PublicSopPage {
  process: PublicProcessItem
}

export interface PublicSopDokumen {
  detail: SopDetail
  langkah: LangkahSOP[]
  diagramKonfigurasi?: PenyusunWorkbenchData['diagramKonfigurasi']
}

export type PublicSopDokumenWorkbench = PenyusunWorkbenchData
