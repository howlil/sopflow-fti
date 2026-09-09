import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlatformRole, StatusKeaktifanProsesBisnis, type Prisma } from '../../../generated/prisma';

const platformAccountSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  nip: true,
  jabatan: true,
  pangkat: true,
  nohp: true,
  platformRole: true,
  deletedAt: true,
} as const;

export type PlatformAccountRow = Prisma.PenggunaGetPayload<{
  select: typeof platformAccountSelect;
}>;

export interface CreatePlatformAccountRepoInput {
  readonly email: string;
  readonly nama: string;
  readonly nip: string;
  readonly pangkat: string;
  readonly jabatan: string;
  readonly nohp: string;
  readonly kataSandi: string;
}

export interface UpdatePlatformAccountRepoInput {
  readonly nama?: string;
  readonly email?: string;
  readonly nip?: string;
  readonly jabatan?: string;
  readonly pangkat?: string;
  readonly nohp?: string;
  readonly deletedAt?: Date | null;
  readonly invalidateSessions?: boolean;
}

@Injectable()
export class PenggunaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPlatformAccounts(): Promise<PlatformAccountRow[]> {
    return this.prisma.pengguna.findMany({
      select: platformAccountSelect,
      orderBy: [{ deletedAt: 'asc' }, { nama: 'asc' }, { email: 'asc' }],
    });
  }

  findPlatformAccount(penggunaId: string): Promise<PlatformAccountRow | null> {
    return this.prisma.pengguna.findUnique({
      where: { penggunaId },
      select: platformAccountSelect,
    });
  }

  async existsEmailOtherThan(email: string, penggunaId: string): Promise<boolean> {
    return (
      (await this.prisma.pengguna.count({
        where: { email, NOT: { penggunaId } },
      })) > 0
    );
  }

  async existsNipOtherThan(nip: string, penggunaId: string): Promise<boolean> {
    return (
      (await this.prisma.pengguna.count({
        where: { nip, NOT: { penggunaId } },
      })) > 0
    );
  }

  async countActiveOwnedProcesses(penggunaId: string): Promise<number> {
    const processes = await this.prisma.prosesBisnis.findMany({
      where: { penanggungJawabId: penggunaId },
      select: { prosesBisnisId: true },
    });
    if (processes.length === 0) return 0;

    const archived = await this.prisma.statusProsesBisnis.findMany({
      where: {
        prosesBisnisId: { in: processes.map(({ prosesBisnisId }) => prosesBisnisId) },
        status: StatusKeaktifanProsesBisnis.ARCHIVED,
      },
      select: { prosesBisnisId: true },
    });
    return processes.length - archived.length;
  }

  countActiveOwnerAuthorities(penggunaId: string): Promise<number> {
    return this.prisma.kewenanganPenanggungJawabProsesBisnis.count({
      where: { penggunaId, revokedAt: null },
    });
  }

  countActiveOrganizationalAuthorities(penggunaId: string): Promise<number> {
    return this.prisma.penugasanPejabatBerwenang.count({
      where: { holderId: penggunaId },
    });
  }

  updatePlatformAccount(
    penggunaId: string,
    input: UpdatePlatformAccountRepoInput,
  ): Promise<PlatformAccountRow> {
    const { invalidateSessions, ...profile } = input;
    return this.prisma.pengguna.update({
      where: { penggunaId },
      data: {
        ...profile,
        ...(invalidateSessions
          ? {
              sesiTokenVersion: { increment: 1 },
              refreshTokenHash: null,
              refreshTokenExpiresAt: null,
            }
          : {}),
      },
      select: platformAccountSelect,
    });
  }

  createPlatformAccount(input: CreatePlatformAccountRepoInput): Promise<PlatformAccountRow> {
    return this.prisma.pengguna.create({
      data: {
        email: input.email,
        nama: input.nama,
        nip: input.nip,
        pangkat: input.pangkat,
        jabatan: input.jabatan,
        nohp: input.nohp,
        kataSandi: input.kataSandi,
        platformRole: PlatformRole.USER,
      },
      select: platformAccountSelect,
    });
  }
}
