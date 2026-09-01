import type { PeranPengguna, PlatformRole } from '@/types/dto/access.dto'

export type OrganizationalScope = 'FACULTY' | 'DEPARTMENT'

export interface DepartmentDto {
  departmentId: string
  nama: string
  createdAt: string
  updatedAt: string
}

export interface ProcessAssignableUserDto {
  penggunaId: string
  nama: string
  email: string
  peran: PeranPengguna
  platformRole: PlatformRole
}

export interface ProcessMemberDto {
  processId: string
  penggunaId: string
  createdAt: string
  pengguna: ProcessAssignableUserDto
}

export interface ProcessDto {
  processId: string
  nama: string
  scope: OrganizationalScope
  departmentId: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  department: DepartmentDto | null
  owner: ProcessAssignableUserDto
  members: ProcessMemberDto[]
}

export interface ProcessPayload {
  nama: string
  scope: OrganizationalScope
  departmentId: string | null
  ownerId: string
  memberIds: string[]
}
