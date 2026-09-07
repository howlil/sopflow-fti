import type { PlatformRole } from '@/types/dto/access.dto'

export type LingkupOrganisasi = 'FACULTY' | 'DEPARTMENT'
export type StatusKeaktifanProsesBisnis = 'ACTIVE' | 'ARCHIVED'

export interface DepartemenDto {
  departemenId: string
  nama: string
  createdAt: string
  updatedAt: string
}

export interface ProsesBisnisAssignableUserDto {
  penggunaId: string
  nama: string
  email: string
  nip?: string
  platformRole: PlatformRole
}

export interface AnggotaProsesBisnisDto {
  prosesBisnisId: string
  penggunaId: string
  createdAt: string
  pengguna: ProsesBisnisAssignableUserDto
}

export interface ProsesBisnisDto {
  prosesBisnisId: string
  nama: string
  scope: LingkupOrganisasi
  departemenId: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  department: DepartemenDto | null
  owner: ProsesBisnisAssignableUserDto
  members: AnggotaProsesBisnisDto[]
  lifecycleStatus?: StatusKeaktifanProsesBisnis
  archivedAt?: string | null
  archivedReason?: string | null
}

/** Administrative repair/bootstrap payload. Normal ProsesBisnis creation is owner self-service. */
export interface ProsesBisnisPayload {
  nama: string
  scope: LingkupOrganisasi
  departemenId: string | null
  ownerId: string
  memberIds: string[]
}

export interface KewenanganPenanggungJawabProsesBisnisDto {
  kewenanganPenanggungJawabProsesBisnisId: string
  penggunaId: string
  scope: LingkupOrganisasi
  departemenId: string | null
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
  department: Pick<DepartemenDto, 'departemenId' | 'nama'> | null
}

export interface GrantKewenanganPenanggungJawabProsesBisnisPayload {
  penggunaId: string
  scope: LingkupOrganisasi
  departemenId: string | null
}

export interface CreateOwnedProsesBisnisPayload {
  nama: string
  scope: LingkupOrganisasi
  departemenId: string | null
}

export interface InviteAnggotaProsesBisnisPayload {
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
}

export type AnggotaProsesBisnisOnboardingResult =
  | {
      kind: 'MEMBER_ADDED'
      member: { penggunaId: string; nama: string; email: string }
    }
  | {
      kind: 'INVITATION_CREATED'
      invitation: { undanganAnggotaProsesBisnisId: string; email: string; expiresAt: string }
      activationPath: string
    }

export interface UndanganAnggotaProsesBisnisPreviewDto {
  email: string
  nama: string
  expiresAt: string
  process: {
    prosesBisnisId: string
    nama: string
    scope: LingkupOrganisasi
    departemenId: string | null
  }
}

export interface RiwayatAktivitasProsesBisnisDto {
  riwayatAktivitasProsesBisnisId: string
  prosesBisnisId: string | null
  actorId: string
  event: string
  targetUserId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
