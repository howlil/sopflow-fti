import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalScope,
  PlatformRole,
  ProcessAuditEvent,
} from '../../../generated/prisma';
import type { GrantProcessOwnerAuthorityDto } from './dto/process-owner.dto';

@Injectable()
export class ProcessOwnerAuthorityService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(penggunaId: string) {
    return this.enrich(
      await this.prisma.processOwnerAuthority.findMany({
        where: { penggunaId, revokedAt: null },
        orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }],
      }),
    );
  }

  async listConfiguration() {
    return this.enrich(
      await this.prisma.processOwnerAuthority.findMany({
        where: { revokedAt: null },
        orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }],
      }),
    );
  }

  async grant(grantedById: string, dto: GrantProcessOwnerAuthorityDto) {
    await this.assertEligibleUser(dto.penggunaId);
    const departmentId = await this.resolveDepartment(dto.scope, dto.departmentId);
    const scopeKey = this.scopeKey(dto.scope, departmentId);

    const authority = await this.prisma.$transaction(async (tx) => {
      const row = await tx.processOwnerAuthority.upsert({
        where: { penggunaId_scopeKey: { penggunaId: dto.penggunaId, scopeKey } },
        create: {
          penggunaId: dto.penggunaId,
          scope: dto.scope,
          departmentId,
          scopeKey,
          grantedById,
        },
        update: {
          scope: dto.scope,
          departmentId,
          grantedById,
          revokedAt: null,
        },
      });
      await tx.processAudit.create({
        data: {
          actorId: grantedById,
          event: ProcessAuditEvent.OWNER_AUTHORITY_GRANTED,
          targetUserId: dto.penggunaId,
          metadata: { scope: dto.scope, departmentId, scopeKey },
        },
      });
      return row;
    });

    return (await this.enrich([authority]))[0];
  }

  async revoke(grantedById: string, processOwnerAuthorityId: string) {
    const current = await this.prisma.processOwnerAuthority.findUnique({
      where: { processOwnerAuthorityId },
    });
    if (current === null || current.revokedAt !== null) {
      throw new NotFoundException('Kewenangan Process Owner aktif tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.processOwnerAuthority.update({
        where: { processOwnerAuthorityId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.processAudit.create({
        data: {
          actorId: grantedById,
          event: ProcessAuditEvent.OWNER_AUTHORITY_REVOKED,
          targetUserId: current.penggunaId,
          metadata: {
            scope: current.scope,
            departmentId: current.departmentId,
            scopeKey: current.scopeKey,
          },
        },
      }),
    ]);
  }

  async assertCanCreate(
    penggunaId: string,
    scope: OrganizationalScope,
    requestedDepartmentId?: string | null,
  ): Promise<{ scope: OrganizationalScope; departmentId: string | null; scopeKey: string }> {
    const departmentId = await this.resolveDepartment(scope, requestedDepartmentId);
    const scopeKey = this.scopeKey(scope, departmentId);
    const authority = await this.prisma.processOwnerAuthority.findUnique({
      where: { penggunaId_scopeKey: { penggunaId, scopeKey } },
    });
    if (authority === null || authority.revokedAt !== null) {
      throw new ForbiddenException('Anda tidak memiliki kewenangan membuat Process pada scope ini');
    }
    return { scope, departmentId, scopeKey };
  }

  scopeKey(scope: OrganizationalScope, departmentId: string | null): string {
    return scope === OrganizationalScope.FACULTY ? 'FACULTY' : `DEPARTMENT:${departmentId}`;
  }

  private async assertEligibleUser(penggunaId: string): Promise<void> {
    const user = await this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: { platformRole: true },
    });
    if (user === null) {
      throw new NotFoundException('Pengguna aktif tidak ditemukan');
    }
    if (user.platformRole !== PlatformRole.USER) {
      throw new ConflictException('SUPER_ADMIN tidak digunakan sebagai Process Owner operasional');
    }
  }

  private async resolveDepartment(
    scope: OrganizationalScope,
    departmentId?: string | null,
  ): Promise<string | null> {
    if (scope === OrganizationalScope.FACULTY) {
      if (departmentId !== null && departmentId !== undefined) {
        throw new ConflictException('Scope FACULTY tidak boleh memiliki departmentId');
      }
      return null;
    }
    if (!departmentId) {
      throw new ConflictException('Scope DEPARTMENT wajib memiliki departmentId');
    }
    const exists = await this.prisma.department.count({ where: { departmentId } });
    if (exists !== 1) {
      throw new NotFoundException('Department tidak ditemukan');
    }
    return departmentId;
  }

  private async enrich<T extends { penggunaId: string; departmentId: string | null }>(rows: T[]) {
    const userIds = [...new Set(rows.map((row) => row.penggunaId))];
    const departmentIds = [...new Set(rows.flatMap((row) => (row.departmentId ? [row.departmentId] : [])))];
    const [users, departments] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: userIds } },
        select: { penggunaId: true, nama: true, email: true, nip: true, deletedAt: true },
      }),
      this.prisma.department.findMany({
        where: { departmentId: { in: departmentIds } },
        select: { departmentId: true, nama: true },
      }),
    ]);
    const userById = new Map(users.map((user) => [user.penggunaId, user]));
    const departmentById = new Map(departments.map((department) => [department.departmentId, department]));
    return rows.map((row) => ({
      ...row,
      user: userById.get(row.penggunaId) ?? null,
      department: row.departmentId ? departmentById.get(row.departmentId) ?? null : null,
    }));
  }
}
