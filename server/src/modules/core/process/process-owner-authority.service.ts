import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LingkupOrganisasi,
  PlatformRole,
  JenisAktivitasProsesBisnis,
} from '../../../generated/prisma';
import type { GrantKewenanganPenanggungJawabProsesBisnisDto } from './dto/process-owner.dto';

@Injectable()
export class KewenanganPenanggungJawabProsesBisnisService {
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

  async grant(grantedById: string, dto: GrantKewenanganPenanggungJawabProsesBisnisDto) {
    await this.assertEligibleUser(dto.penggunaId);
    const departemenId = await this.resolveDepartemen(dto.scope, dto.departemenId);
    const scopeKey = this.scopeKey(dto.scope, departemenId);

    const authority = await this.prisma.$transaction(async (tx) => {
      const row = await tx.processOwnerAuthority.upsert({
        where: { penggunaId_scopeKey: { penggunaId: dto.penggunaId, scopeKey } },
        create: {
          penggunaId: dto.penggunaId,
          scope: dto.scope,
          departemenId,
          scopeKey,
          grantedById,
        },
        update: {
          scope: dto.scope,
          departemenId,
          grantedById,
          revokedAt: null,
        },
      });
      await tx.processAudit.create({
        data: {
          actorId: grantedById,
          event: JenisAktivitasProsesBisnis.OWNER_AUTHORITY_GRANTED,
          targetUserId: dto.penggunaId,
          metadata: { scope: dto.scope, departemenId, scopeKey },
        },
      });
      return row;
    });

    return (await this.enrich([authority]))[0];
  }

  async revoke(grantedById: string, kewenanganPenanggungJawabProsesBisnisId: string) {
    const current = await this.prisma.processOwnerAuthority.findUnique({
      where: { kewenanganPenanggungJawabProsesBisnisId },
    });
    if (current === null || current.revokedAt !== null) {
      throw new NotFoundException('Kewenangan Penanggung Jawab Proses Bisnis aktif tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.processOwnerAuthority.update({
        where: { kewenanganPenanggungJawabProsesBisnisId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.processAudit.create({
        data: {
          actorId: grantedById,
          event: JenisAktivitasProsesBisnis.OWNER_AUTHORITY_REVOKED,
          targetUserId: current.penggunaId,
          metadata: {
            scope: current.scope,
            departemenId: current.departemenId,
            scopeKey: current.scopeKey,
          },
        },
      }),
    ]);
  }

  async assertCanCreate(
    penggunaId: string,
    scope: LingkupOrganisasi,
    requestedDepartemenId?: string | null,
  ): Promise<{ scope: LingkupOrganisasi; departemenId: string | null; scopeKey: string }> {
    const departemenId = await this.resolveDepartemen(scope, requestedDepartemenId);
    const scopeKey = this.scopeKey(scope, departemenId);
    const authority = await this.prisma.processOwnerAuthority.findUnique({
      where: { penggunaId_scopeKey: { penggunaId, scopeKey } },
    });
    if (authority === null || authority.revokedAt !== null) {
      throw new ForbiddenException('Anda tidak memiliki kewenangan membuat Proses Bisnis pada scope ini');
    }
    return { scope, departemenId, scopeKey };
  }

  scopeKey(scope: LingkupOrganisasi, departemenId: string | null): string {
    return scope === LingkupOrganisasi.FACULTY ? 'FACULTY' : `DEPARTMENT:${departemenId}`;
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
      throw new ConflictException('SUPER_ADMIN tidak digunakan sebagai Penanggung Jawab Proses Bisnis operasional');
    }
  }

  private async resolveDepartemen(
    scope: LingkupOrganisasi,
    departemenId?: string | null,
  ): Promise<string | null> {
    if (scope === LingkupOrganisasi.FACULTY) {
      if (departemenId !== null && departemenId !== undefined) {
        throw new ConflictException('Scope FACULTY tidak boleh memiliki departemenId');
      }
      return null;
    }
    if (!departemenId) {
      throw new ConflictException('Scope DEPARTMENT wajib memiliki departemenId');
    }
    const exists = await this.prisma.department.count({ where: { departemenId } });
    if (exists !== 1) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }
    return departemenId;
  }

  private async enrich<T extends { penggunaId: string; departemenId: string | null }>(rows: T[]) {
    const userIds = [...new Set(rows.map((row) => row.penggunaId))];
    const departemenIds = [...new Set(rows.flatMap((row) => (row.departemenId ? [row.departemenId] : [])))];
    const [users, departments] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: userIds } },
        select: { penggunaId: true, nama: true, email: true, nip: true, deletedAt: true },
      }),
      this.prisma.department.findMany({
        where: { departemenId: { in: departemenIds } },
        select: { departemenId: true, nama: true },
      }),
    ]);
    const userById = new Map(users.map((user) => [user.penggunaId, user]));
    const departmentById = new Map(departments.map((department) => [department.departemenId, department]));
    return rows.map((row) => ({
      ...row,
      user: userById.get(row.penggunaId) ?? null,
      department: row.departemenId ? departmentById.get(row.departemenId) ?? null : null,
    }));
  }
}
