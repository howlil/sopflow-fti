import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganizationalAuthority, OrganizationalScope } from '../../../generated/prisma';

export interface ResolvedOrganizationalAuthority {
  authorityKey: string;
  authority: OrganizationalAuthority;
  departmentId: string | null;
  holderId: string;
  holderName: string;
  processId: string;
  processName: string;
  scope: OrganizationalScope;
}

@Injectable()
export class OrganizationalAuthorityService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    return this.prisma.organizationalAuthorityAssignment.findMany({
      where: { holderId: userId },
      orderBy: { authorityKey: 'asc' },
    });
  }

  async listConfiguration() {
    const assignments = await this.prisma.organizationalAuthorityAssignment.findMany({
      orderBy: { authorityKey: 'asc' },
    });
    const holderIds = [...new Set(assignments.map((assignment) => assignment.holderId))];
    const departmentIds = [...new Set(assignments.flatMap((assignment) => assignment.departmentId ? [assignment.departmentId] : []))];
    const [holders, departments] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: holderIds } },
        select: { penggunaId: true, nama: true, email: true, deletedAt: true },
      }),
      this.prisma.department.findMany({
        where: { departmentId: { in: departmentIds } },
        select: { departmentId: true, nama: true },
      }),
    ]);
    const holderById = new Map(holders.map((holder) => [holder.penggunaId, holder]));
    const departmentById = new Map(departments.map((department) => [department.departmentId, department]));
    return assignments.map((assignment) => ({
      ...assignment,
      holder: holderById.get(assignment.holderId) ?? null,
      department: assignment.departmentId ? departmentById.get(assignment.departmentId) ?? null : null,
    }));
  }

  async assignDean(holderId: string) {
    await this.assertActiveUser(holderId);
    return this.prisma.organizationalAuthorityAssignment.upsert({
      where: { authorityKey: this.deanKey() },
      create: {
        authorityKey: this.deanKey(),
        authority: OrganizationalAuthority.DEAN,
        departmentId: null,
        holderId,
      },
      update: {
        authority: OrganizationalAuthority.DEAN,
        departmentId: null,
        holderId,
      },
    });
  }

  async assignDepartmentHead(departmentId: string, holderId: string) {
    const [department] = await Promise.all([
      this.prisma.department.findUnique({ where: { departmentId }, select: { departmentId: true } }),
      this.assertActiveUser(holderId),
    ]);
    if (department === null) {
      throw new NotFoundException('Department tidak ditemukan');
    }
    const authorityKey = this.departmentHeadKey(departmentId);
    return this.prisma.organizationalAuthorityAssignment.upsert({
      where: { authorityKey },
      create: {
        authorityKey,
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        departmentId,
        holderId,
      },
      update: {
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        departmentId,
        holderId,
      },
    });
  }

  async resolveForProcess(processId: string): Promise<ResolvedOrganizationalAuthority> {
    const process = await this.prisma.process.findUnique({
      where: { processId },
      select: { processId: true, nama: true, scope: true, departmentId: true },
    });
    if (process === null) {
      throw new NotFoundException('Process tidak ditemukan');
    }

    const authority = process.scope === OrganizationalScope.FACULTY
      ? OrganizationalAuthority.DEAN
      : OrganizationalAuthority.HEAD_OF_DEPARTMENT;
    if (process.scope === OrganizationalScope.DEPARTMENT && process.departmentId === null) {
      throw new ConflictException('Process DEPARTMENT tidak memiliki konteks department');
    }
    const authorityKey = process.scope === OrganizationalScope.FACULTY
      ? this.deanKey()
      : this.departmentHeadKey(process.departmentId as string);

    const assignment = await this.prisma.organizationalAuthorityAssignment.findUnique({
      where: { authorityKey },
    });
    if (assignment === null) {
      throw new ConflictException(
        process.scope === OrganizationalScope.FACULTY
          ? 'Dean aktif belum dikonfigurasi'
          : 'Kepala Departemen aktif belum dikonfigurasi',
      );
    }
    if (
      assignment.authority !== authority ||
      assignment.departmentId !== process.departmentId
    ) {
      throw new ConflictException('Konfigurasi organizational authority tidak konsisten');
    }
    const holder = await this.prisma.pengguna.findFirst({
      where: { penggunaId: assignment.holderId, deletedAt: null },
      select: { penggunaId: true, nama: true },
    });
    if (holder === null) {
      throw new ConflictException('Pemegang organizational authority tidak aktif');
    }
    return {
      authorityKey,
      authority,
      departmentId: process.departmentId,
      holderId: holder.penggunaId,
      holderName: holder.nama,
      processId: process.processId,
      processName: process.nama,
      scope: process.scope,
    };
  }

  async assertCanApprove(userId: string, processId: string): Promise<ResolvedOrganizationalAuthority> {
    const resolved = await this.resolveForProcess(processId);
    if (resolved.holderId !== userId) {
      throw new ForbiddenException('Anda bukan final approver untuk organizational scope Process ini');
    }
    return resolved;
  }

  deanKey(): string {
    return 'DEAN';
  }

  departmentHeadKey(departmentId: string): string {
    return `HEAD_OF_DEPARTMENT:${departmentId}`;
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const exists = await this.prisma.pengguna.count({ where: { penggunaId: userId, deletedAt: null } });
    if (exists !== 1) {
      throw new NotFoundException('Pengguna aktif tidak ditemukan');
    }
  }
}
