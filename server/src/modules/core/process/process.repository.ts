import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { OrganizationalScope } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  peran: true,
  platformRole: true,
} as const;

@Injectable()
export class ProcessRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDepartments() {
    return this.prisma.department.findMany({ orderBy: { nama: 'asc' } });
  }

  createDepartment(nama: string) {
    return this.prisma.department.create({ data: { nama } });
  }

  updateDepartment(departmentId: string, nama: string) {
    return this.prisma.department.update({ where: { departmentId }, data: { nama } });
  }

  async departmentExists(departmentId: string): Promise<boolean> {
    return (
      (await this.prisma.department.count({ where: { departmentId } })) === 1
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

  listProcesses() {
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

  findProcessById(processId: string) {
    return this.prisma.process.findUnique({
      where: { processId },
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

  createProcess(input: {
    nama: string;
    scope: OrganizationalScope;
    departmentId: string | null;
    ownerId: string;
    memberIds: string[];
  }) {
    return this.prisma.process.create({
      data: {
        nama: input.nama,
        scope: input.scope,
        departmentId: input.departmentId,
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

  updateProcess(
    processId: string,
    input: {
      nama: string;
      scope: OrganizationalScope;
      departmentId: string | null;
      ownerId: string;
      memberIds: string[];
    },
  ) {
    return this.prisma.process.update({
      where: { processId },
      data: {
        nama: input.nama,
        scope: input.scope,
        departmentId: input.departmentId,
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
