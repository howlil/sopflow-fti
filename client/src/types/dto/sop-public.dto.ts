import type { PaginationMetaDto } from '@/types/dto/evaluasi.dto'
import type { LangkahSOP, PenyusunWorkbenchData, SopDetail } from '@/types/dto/sop.dto'

export interface PublicArsipQueryParams {
  page?: number
  limit?: number
  search?: string
}

export type PublicOrganizationalScope = 'FACULTY' | 'DEPARTMENT'

export interface PublicOpdItem {
  opdId: string
  nama: string
  jumlahSopBerlaku: number
}

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
  opdId: string
  judul: string
  nomorSOP: string
  versi: number
  tanggalEfektif: string | null
  opdNama: string
  processId: string | null
  processName: string | null
  scope: PublicOrganizationalScope | null
  departmentId: string | null
  departmentName: string | null
  pdfUrl: string
}

export interface PublicOpdPage {
  items: PublicOpdItem[]
  pagination: PaginationMetaDto
}

export interface PublicProcessPage {
  items: PublicProcessItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopPage {
  items: PublicSopItem[]
  pagination: PaginationMetaDto
}

export interface PublicSopByOpdPage extends PublicSopPage {
  opd: { opdId: string; nama: string }
}

export interface PublicSopByProcessPage extends PublicSopPage {
  process: PublicProcessItem
}

export interface PublicSopDokumen {
  opd: { id: string; nama: string }
  detail: SopDetail
  langkah: LangkahSOP[]
  diagramKonfigurasi?: PenyusunWorkbenchData['diagramKonfigurasi']
}

/** Alias agar mapper pratinjau dapat memakai PenyusunWorkbenchData. */
export type PublicSopDokumenWorkbench = PenyusunWorkbenchData & {
  opd: { id: string; nama: string }
}
