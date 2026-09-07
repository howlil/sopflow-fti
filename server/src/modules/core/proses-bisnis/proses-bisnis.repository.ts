import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { LingkupOrganisasi } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,

  platformRole: true,
} as const;

@Injectable()
export class ProsesBisnisRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDepartemen() {
    return this.prisma.departemen.findMany({ orderBy: { nama: 'asc' } });
  }

  createDepartemen(nama: string) {
    return this.prisma.departemen.create({ data: { nama } });
  }

  updateDepartemen(departemenId: string, nama: string) {
    return this.prisma.departemen.update({ where: { departemenId }, data: { nama } });
  }

  async departmentExists(departemenId: string): Promise<boolean> {
    return (
      (await this.prisma.departemen.count({ where: { departemenId } })) === 1
    );
  }

  listAssignableUsers(search?: string) {
    const term = search?.trim();
    return this.prisma.pengguna.findMany({
      where: {
        deletedAt: null,
        ...(term
          ? {
              OR: [
                { nama: { contains: term } },
                { email: { contains: term } },
                { nip: { contains: term } },
              ],
            }
          : {}),
      },
      select: userSelect,
      orderBy: { nama: 'asc' },
      take: 100,
    });
  }

  findActiveUsersByIds(penggunaIds: string[]) {
    return this.prisma.pengguna.findMany({
      where: { penggunaId: { in: penggunaIds }, deletedAt: null },
      select: { penggunaId: true },
    });
  }

  listProsesBisnis() {
    return this.prisma.prosesBisnis.findMany({
      include: {
        departemen: true,
        penanggungJawab: { select: userSelect },
        anggota: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ lingkup: 'asc' }, { nama: 'asc' }],
    });
  }

  findProsesBisnisById(prosesBisnisId: string) {
    return this.prisma.prosesBisnis.findUnique({
      where: { prosesBisnisId },
      include: {
        departemen: true,
        penanggungJawab: { select: userSelect },
        anggota: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  createProsesBisnis(input: {
    nama: string;
    lingkup: LingkupOrganisasi;
    departemenId: string | null;
    penanggungJawabId: string;
    anggotaIds: string[];
  }) {
    return this.prisma.prosesBisnis.create({
      data: {
        nama: input.nama,
        lingkup: input.lingkup,
        departemenId: input.departemenId,
        penanggungJawabId: input.penanggungJawabId,
        anggota: { create: input.anggotaIds.map((penggunaId) => ({ penggunaId })) },
      },
      include: {
        departemen: true,
        penanggungJawab: { select: userSelect },
        anggota: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  updateProsesBisnis(
    prosesBisnisId: string,
    input: {
      nama: string;
      lingkup: LingkupOrganisasi;
      departemenId: string | null;
      penanggungJawabId: string;
      anggotaIds: string[];
    },
  ) {
    return this.prisma.prosesBisnis.update({
      where: { prosesBisnisId },
      data: {
        nama: input.nama,
        lingkup: input.lingkup,
        departemenId: input.departemenId,
        penanggungJawabId: input.penanggungJawabId,
        anggota: {
          deleteMany: {},
          create: input.anggotaIds.map((penggunaId) => ({ penggunaId })),
        },
      },
      include: {
        departemen: true,
        penanggungJawab: { select: userSelect },
        anggota: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
