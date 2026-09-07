import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LingkupOrganisasi,
  PlatformRole,
  JenisAktivitasProsesBisnis,
} from '../../../generated/prisma';
import type { GrantKewenanganPenanggungJawabProsesBisnisDto } from './dto/penanggung-jawab-proses-bisnis.dto';

@Injectable()
export class KewenanganPenanggungJawabProsesBisnisService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(penggunaId: string) {
    return this.enrich(
      await this.prisma.kewenanganPenanggungJawabProsesBisnis.findMany({
        where: { penggunaId, revokedAt: null },
        orderBy: [{ lingkup: 'asc' }, { createdAt: 'asc' }],
      }),
    );
  }

  async listConfiguration() {
    return this.enrich(
      await this.prisma.kewenanganPenanggungJawabProsesBisnis.findMany({
        where: { revokedAt: null },
        orderBy: [{ lingkup: 'asc' }, { createdAt: 'asc' }],
      }),
    );
  }

  async grant(grantedById: string, dto: GrantKewenanganPenanggungJawabProsesBisnisDto) {
    await this.assertEligibleUser(dto.penggunaId);
    const departemenId = await this.resolveDepartemen(dto.lingkup, dto.departemenId);
    const kunciLingkup = this.kunciLingkup(dto.lingkup, departemenId);

    const authority = await this.prisma.$transaction(async (tx) => {
      const row = await tx.kewenanganPenanggungJawabProsesBisnis.upsert({
        where: { penggunaId_kunciLingkup: { penggunaId: dto.penggunaId, kunciLingkup } },
        create: {
          penggunaId: dto.penggunaId,
          lingkup: dto.lingkup,
          departemenId,
          kunciLingkup,
          grantedById,
        },
        update: {
          lingkup: dto.lingkup,
          departemenId,
          grantedById,
          revokedAt: null,
        },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          actorId: grantedById,
          event: JenisAktivitasProsesBisnis.OWNER_AUTHORITY_GRANTED,
          targetUserId: dto.penggunaId,
          metadata: { lingkup: dto.lingkup, departemenId, kunciLingkup },
        },
      });
      return row;
    });

    return (await this.enrich([authority]))[0];
  }

  async revoke(grantedById: string, kewenanganPenanggungJawabProsesBisnisId: string) {
    const current = await this.prisma.kewenanganPenanggungJawabProsesBisnis.findUnique({
      where: { kewenanganPenanggungJawabProsesBisnisId },
    });
    if (current === null || current.revokedAt !== null) {
      throw new NotFoundException('Kewenangan Penanggung Jawab Proses Bisnis aktif tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.kewenanganPenanggungJawabProsesBisnis.update({
        where: { kewenanganPenanggungJawabProsesBisnisId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          actorId: grantedById,
          event: JenisAktivitasProsesBisnis.OWNER_AUTHORITY_REVOKED,
          targetUserId: current.penggunaId,
          metadata: {
            lingkup: current.lingkup,
            departemenId: current.departemenId,
            kunciLingkup: current.kunciLingkup,
          },
        },
      }),
    ]);
  }

  async assertCanCreate(
    penggunaId: string,
    lingkup: LingkupOrganisasi,
    requestedDepartemenId?: string | null,
  ): Promise<{ lingkup: LingkupOrganisasi; departemenId: string | null; kunciLingkup: string }> {
    const departemenId = await this.resolveDepartemen(lingkup, requestedDepartemenId);
    const kunciLingkup = this.kunciLingkup(lingkup, departemenId);
    const authority = await this.prisma.kewenanganPenanggungJawabProsesBisnis.findUnique({
      where: { penggunaId_kunciLingkup: { penggunaId, kunciLingkup } },
    });
    if (authority === null || authority.revokedAt !== null) {
      throw new ForbiddenException('Anda tidak memiliki kewenangan membuat Proses Bisnis pada lingkup ini');
    }
    return { lingkup, departemenId, kunciLingkup };
  }

  kunciLingkup(lingkup: LingkupOrganisasi, departemenId: string | null): string {
    return lingkup === LingkupOrganisasi.FACULTY ? 'FACULTY' : `DEPARTMENT:${departemenId}`;
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
    lingkup: LingkupOrganisasi,
    departemenId?: string | null,
  ): Promise<string | null> {
    if (lingkup === LingkupOrganisasi.FACULTY) {
      if (departemenId !== null && departemenId !== undefined) {
        throw new ConflictException('Lingkup FACULTY tidak boleh memiliki departemenId');
      }
      return null;
    }
    if (!departemenId) {
      throw new ConflictException('Lingkup DEPARTMENT wajib memiliki departemenId');
    }
    const exists = await this.prisma.departemen.count({ where: { departemenId } });
    if (exists !== 1) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }
    return departemenId;
  }

  private async enrich<T extends { penggunaId: string; departemenId: string | null }>(rows: T[]) {
    const userIds = [...new Set(rows.map((row) => row.penggunaId))];
    const departemenIds = [...new Set(rows.flatMap((row) => (row.departemenId ? [row.departemenId] : [])))];
    const [users, departemen] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: userIds } },
        select: { penggunaId: true, nama: true, email: true, nip: true, deletedAt: true },
      }),
      this.prisma.departemen.findMany({
        where: { departemenId: { in: departemenIds } },
        select: { departemenId: true, nama: true },
      }),
    ]);
    const userById = new Map(users.map((user) => [user.penggunaId, user]));
    const departmentById = new Map(departemen.map((department) => [department.departemenId, department]));
    return rows.map((row) => ({
      ...row,
      user: userById.get(row.penggunaId) ?? null,
      departemen: row.departemenId ? departmentById.get(row.departemenId) ?? null : null,
    }));
  }
}
