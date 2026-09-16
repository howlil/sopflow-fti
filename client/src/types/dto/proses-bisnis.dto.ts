import type { PlatformRole } from '@/types/dto/access.dto'

export type LingkupOrganisasi = 'FACULTY' | 'DEPARTMENT'
export type StatusKeaktifanProsesBisnis = 'ACTIVE' | 'ARCHIVED'
export type StatusUndanganAnggotaProsesBisnis = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

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
  deletedAt?: string | null
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
  lingkup: LingkupOrganisasi
  departemenId: string | null
  penanggungJawabId: string
  createdAt: string
  updatedAt: string
  departemen: DepartemenDto | null
  penanggungJawab: ProsesBisnisAssignableUserDto
  anggota: AnggotaProsesBisnisDto[]
  siklusStatus?: StatusKeaktifanProsesBisnis
  archivedAt?: string | null
  archivedReason?: string | null
}

export interface KewenanganPenanggungJawabProsesBisnisDto {
  kewenanganPenanggungJawabProsesBisnisId: string
  penggunaId: string
  lingkup: LingkupOrganisasi
  departemenId: string | null
  kunciLingkup: string
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
  departemen: Pick<DepartemenDto, 'departemenId' | 'nama'> | null
}

export interface GrantKewenanganPenanggungJawabProsesBisnisPayload {
  penggunaId: string
  lingkup: LingkupOrganisasi
  departemenId: string | null
}

export interface CreateOwnedProsesBisnisPayload {
  nama: string
  kewenanganPenanggungJawabProsesBisnisId: string
}

export interface UndanganAnggotaProsesBisnisDto {
  undanganAnggotaProsesBisnisId: string
  prosesBisnisId: string
  email: string
  nama: string
  nip: string
  jabatan: string
  pangkat: string
  nohp: string
  status: StatusUndanganAnggotaProsesBisnis
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProsesBisnisMemberDirectoryDto {
  prosesBisnisId: string
  nama: string
  lingkup: LingkupOrganisasi
  departemenId: string | null
  penanggungJawabId: string
  departemen: DepartemenDto | null
  penanggungJawab: ProsesBisnisAssignableUserDto
  anggota: AnggotaProsesBisnisDto[]
  undangan: UndanganAnggotaProsesBisnisDto[]
  siklusStatus?: StatusKeaktifanProsesBisnis
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
      anggota: { penggunaId: string; nama: string; email: string }
    }
  | {
      kind: 'INVITATION_CREATED'
      undangan: { undanganAnggotaProsesBisnisId: string; email: string; expiresAt: string }
      activationPath: string
    }

export interface PenugasanPenyusunSopRowDto {
  sopId: string
  detailSopId: string | null
  judul: string
  nomorSOP: string | null
  versi: number | null
  status: string | null
  updatedAt: string | null
  prosesBisnisId: string
  namaProsesBisnis: string
  penyusun: {
    penggunaId: string
    nama: string
    email: string
    aktif: boolean
    ditugaskanPada: string
  } | null
}

export interface AssignPenyusunSopResultDto {
  sopId: string
  prosesBisnisId: string
  penyusun: {
    penggunaId: string
    nama: string
    email: string
  }
  ditugaskanPada: string
}

export interface UndanganAnggotaProsesBisnisPreviewDto {
  email: string
  nama: string
  expiresAt: string
  prosesBisnis: {
    prosesBisnisId: string
    nama: string
    lingkup: LingkupOrganisasi
    departemenId: string | null
  }
}

export interface TerbitkanUlangUndanganResult {
  undangan: Pick<UndanganAnggotaProsesBisnisDto, 'undanganAnggotaProsesBisnisId' | 'email' | 'expiresAt'>
  activationPath: string
}
