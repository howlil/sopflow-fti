import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlatformRole, type Prisma } from '../../../generated/prisma';

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

@Injectable()
export class PenggunaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPlatformAccounts(): Promise<PlatformAccountRow[]> {
    return this.prisma.pengguna.findMany({
      where: { deletedAt: null },
      select: platformAccountSelect,
      orderBy: [{ nama: 'asc' }, { email: 'asc' }],
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
