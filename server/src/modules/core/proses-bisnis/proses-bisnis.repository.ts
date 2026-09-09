import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LingkupOrganisasi, PejabatBerwenang, PlatformRole } from '../../../generated/prisma';

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

  listAssignableUsers(search?: string) {
    const term = search?.trim();
    return this.prisma.pengguna.findMany({
      where: {
        deletedAt: null,
        platformRole: PlatformRole.USER,
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

  async getAdminOverview() {
    const [
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      activeWorkflowUsers,
      departemen,
      prosesBisnisByScope,
      ownerAuthoritiesByScope,
      approvalAssignments,
    ] = await Promise.all([
      this.prisma.pengguna.count(),
      this.prisma.pengguna.count({ where: { deletedAt: null } }),
      this.prisma.pengguna.count({ where: { deletedAt: { not: null } } }),
      this.prisma.pengguna.count({
        where: { deletedAt: null, platformRole: PlatformRole.USER },
      }),
      this.prisma.departemen.findMany({
        select: { departemenId: true, nama: true },
        orderBy: { nama: 'asc' },
      }),
      this.prisma.prosesBisnis.groupBy({
        by: ['lingkup'],
        _count: { _all: true },
      }),
      this.prisma.kewenanganPenanggungJawabProsesBisnis.groupBy({
        by: ['lingkup'],
        where: { revokedAt: null },
        _count: { _all: true },
      }),
      this.prisma.penugasanPejabatBerwenang.findMany({
        select: { authority: true, departemenId: true, holderId: true },
      }),
    ]);

    const holderIds = [...new Set(approvalAssignments.map(({ holderId }) => holderId))];
    const activeHolders = await this.prisma.pengguna.findMany({
      where: {
        penggunaId: { in: holderIds },
        deletedAt: null,
        platformRole: PlatformRole.USER,
      },
      select: { penggunaId: true },
    });
    const activeHolderIds = new Set(activeHolders.map(({ penggunaId }) => penggunaId));
    const validAssignments = approvalAssignments.filter(({ holderId }) =>
      activeHolderIds.has(holderId),
    );
    const configuredDepartmentIds = new Set(
      validAssignments
        .filter(
          ({ authority, departemenId }) =>
            authority === PejabatBerwenang.HEAD_OF_DEPARTMENT && departemenId !== null,
        )
        .map(({ departemenId }) => departemenId as string),
    );
    const deanConfigured = validAssignments.some(
      ({ authority, departemenId }) => authority === PejabatBerwenang.DEAN && departemenId === null,
    );

    const countByScope = (
      rows: Array<{ lingkup: LingkupOrganisasi; _count: { _all: number } }>,
      lingkup: LingkupOrganisasi,
    ) => rows.find((row) => row.lingkup === lingkup)?._count._all ?? 0;

    return {
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        inactive: inactiveAccounts,
        workflowUsers: activeWorkflowUsers,
      },
      organization: {
        departemen: departemen.length,
        prosesBisnis: prosesBisnisByScope.reduce((total, row) => total + row._count._all, 0),
        facultyProcesses: countByScope(prosesBisnisByScope, LingkupOrganisasi.FACULTY),
        departmentProcesses: countByScope(prosesBisnisByScope, LingkupOrganisasi.DEPARTMENT),
      },
      ownerGovernance: {
        activeAssignments: ownerAuthoritiesByScope.reduce(
          (total, row) => total + row._count._all,
          0,
        ),
        facultyScopes: countByScope(ownerAuthoritiesByScope, LingkupOrganisasi.FACULTY),
        departmentScopes: countByScope(ownerAuthoritiesByScope, LingkupOrganisasi.DEPARTMENT),
      },
      finalApproval: {
        deanConfigured,
        departmentHeadsConfigured: configuredDepartmentIds.size,
        departmentsWithoutHead: departemen
          .filter(({ departemenId }) => !configuredDepartmentIds.has(departemenId))
          .map(({ departemenId, nama }) => ({ departemenId, nama })),
      },
    };
  }
}
