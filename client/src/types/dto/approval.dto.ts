import type { OrganizationalScope } from './process.dto'
import type { PenyusunWorkbenchData } from './sop.dto'

export type OrganizationalAuthority = 'DEAN' | 'HEAD_OF_DEPARTMENT'

export interface OrganizationalAuthorityAssignmentDto {
  authorityKey: string
  authority: OrganizationalAuthority
  departmentId: string | null
  holderId: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationalAuthorityConfigurationDto extends OrganizationalAuthorityAssignmentDto {
  holder: {
    penggunaId: string
    nama: string
    email: string
    deletedAt: string | null
  } | null
  department: { departmentId: string; nama: string } | null
}

export interface ProcessFinalApprovalDto {
  detailSopId: string
  processId: string
  approvedById: string
  authority: OrganizationalAuthority
  authorityKey: string
  approvedAt: string
}

export interface ProcessApprovalQueueRowDto {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  processId: string
  processNama: string
  scope: OrganizationalScope
  departmentId: string | null
  departmentNama: string | null
  approval: ProcessFinalApprovalDto | null
  updatedAt: string
}

export interface ProcessApprovalDocumentDto {
  workbench: PenyusunWorkbenchData
  authority: {
    authority: OrganizationalAuthority
    authorityKey: string
    holderId: string
    holderName: string
    holderNip: string
    holderJabatan: string
  }
}

export interface ProcessRevocationQueueRowDto {
  detailSopId: string
  sopId: string
  judul: string
  nomorSOP: string
  versi: number
  processId: string
  processNama: string
  scope: OrganizationalScope
  departmentId: string | null
  departmentNama: string | null
  updatedAt: string
}

export interface ProcessRevocationResultDto {
  detailSopId: string
  sopId: string
  processId: string
  status: 'DICABUT'
}
