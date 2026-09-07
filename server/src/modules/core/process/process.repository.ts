import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { LingkupOrganisasi } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  peran: true,
  platformRole: true,
} as const;

@Injectable()
export class ProsesBisnisRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDepartemens() {
    return this.prisma.department.findMany({ orderBy: { nama: 'asc' } });
  }

  createDepartemen(nama: string) {
    return this.prisma.department.create({ data: { nama } });
  }

  updateDepartemen(departemenId: string, nama: string) {
    return this.prisma.department.update({ where: { departemenId }, data: { nama } });
  }

  async departmentExists(departemenId: string): Promise<boolean> {
    return (
      (await this.prisma.department.count({ where: { departemenId } })) === 1
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

  listProsesBisnises() {
    return this.prisma.process.findMany({
      include: {
        department: true,
        owner: { select: userSelect },
        members: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
  }

  findProsesBisnisById(prosesBisnisId: string) {
    return this.prisma.process.findUnique({
      where: { prosesBisnisId },
      include: {
        department: true,
        owner: { select: userSelect },
        members: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  createProsesBisnis(input: {
    nama: string;
    scope: LingkupOrganisasi;
    departemenId: string | null;
    ownerId: string;
    memberIds: string[];
  }) {
    return this.prisma.process.create({
      data: {
        nama: input.nama,
        scope: input.scope,
        departemenId: input.departemenId,
        ownerId: input.ownerId,
        members: { create: input.memberIds.map((penggunaId) => ({ penggunaId })) },
      },
      include: {
        department: true,
        owner: { select: userSelect },
        members: {
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
      scope: LingkupOrganisasi;
      departemenId: string | null;
      ownerId: string;
      memberIds: string[];
    },
  ) {
    return this.prisma.process.update({
      where: { prosesBisnisId },
      data: {
        nama: input.nama,
        scope: input.scope,
        departemenId: input.departemenId,
        ownerId: input.ownerId,
        members: {
          deleteMany: {},
          create: input.memberIds.map((penggunaId) => ({ penggunaId })),
        },
      },
      include: {
        department: true,
        owner: { select: userSelect },
        members: {
          include: { pengguna: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
