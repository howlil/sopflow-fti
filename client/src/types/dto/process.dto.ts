import type { PeranPengguna, PlatformRole } from '@/types/dto/access.dto'

export type OrganizationalScope = 'FACULTY' | 'DEPARTMENT'
export type ProcessLifecycleStatus = 'ACTIVE' | 'ARCHIVED'

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
  nip?: string
  peran?: PeranPengguna
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
  lifecycleStatus?: ProcessLifecycleStatus
  archivedAt?: string | null
  archivedReason?: string | null
}

/** Compatibility/admin maintenance payload. Normal Process creation is owner self-service. */
export interface ProcessPayload {
  nama: string
  scope: OrganizationalScope
  departmentId: string | null
  ownerId: string
  memberIds: string[]
}

export interface ProcessOwnerAuthorityDto {
  processOwnerAuthorityId: string
  penggunaId: string
  scope: OrganizationalScope
  departmentId: string | null
  scopeKey: string
  revokedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    penggunaId: string
    nama: string
    email: string
    nip: string
    deletedAt: string | null
  } | null
  department: Pick<DepartmentDto, 'departmentId' | 'nama'> | null
}

export interface GrantProcessOwnerAuthorityPayload {
  penggunaId: string
  scope: OrganizationalScope
  departmentId: string | null
}

export interface CreateOwnedProcessPayload {
  nama: string
  scope: OrganizationalScope
  departmentId: string | null
}

export interface InviteProcessMemberPayload {
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
}

export type ProcessMemberOnboardingResult =
  | {
      kind: 'MEMBER_ADDED'
      member: { penggunaId: string; nama: string; email: string }
    }
  | {
      kind: 'INVITATION_CREATED'
      invitation: { processInvitationId: string; email: string; expiresAt: string }
      activationPath: string
    }

export interface ProcessInvitationPreviewDto {
  email: string
  nama: string
  expiresAt: string
  process: {
    processId: string
    nama: string
    scope: OrganizationalScope
    departmentId: string | null
  }
}

export interface ProcessAuditDto {
  processAuditId: string
  processId: string | null
  actorId: string
  event: string
  targetUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
