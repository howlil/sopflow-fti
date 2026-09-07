import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PejabatBerwenang, LingkupOrganisasi } from '../../../generated/prisma';

export interface ResolvedPejabatBerwenang {
  authorityKey: string;
  authority: PejabatBerwenang;
  departemenId: string | null;
  holderId: string;
  holderName: string;
  holderNip: string;
  holderJabatan: string;
  prosesBisnisId: string;
  namaProsesBisnis: string;
  scope: LingkupOrganisasi;
}

@Injectable()
export class PejabatBerwenangService {
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
    const departemenIds = [...new Set(assignments.flatMap((assignment) => assignment.departemenId ? [assignment.departemenId] : []))];
    const [holders, departments] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: holderIds } },
        select: { penggunaId: true, nama: true, email: true, deletedAt: true },
      }),
      this.prisma.department.findMany({
        where: { departemenId: { in: departemenIds } },
        select: { departemenId: true, nama: true },
      }),
    ]);
    const holderById = new Map(holders.map((holder) => [holder.penggunaId, holder]));
    const departmentById = new Map(departments.map((department) => [department.departemenId, department]));
    return assignments.map((assignment) => ({
      ...assignment,
      holder: holderById.get(assignment.holderId) ?? null,
      department: assignment.departemenId ? departmentById.get(assignment.departemenId) ?? null : null,
    }));
  }

  async assignDean(holderId: string) {
    await this.assertActiveUser(holderId);
    return this.prisma.organizationalAuthorityAssignment.upsert({
      where: { authorityKey: this.deanKey() },
      create: {
        authorityKey: this.deanKey(),
        authority: PejabatBerwenang.DEAN,
        departemenId: null,
        holderId,
      },
      update: {
        authority: PejabatBerwenang.DEAN,
        departemenId: null,
        holderId,
      },
    });
  }

  async assignDepartemenHead(departemenId: string, holderId: string) {
    const [department] = await Promise.all([
      this.prisma.department.findUnique({ where: { departemenId }, select: { departemenId: true } }),
      this.assertActiveUser(holderId),
    ]);
    if (department === null) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }
    const authorityKey = this.departmentHeadKey(departemenId);
    return this.prisma.organizationalAuthorityAssignment.upsert({
      where: { authorityKey },
      create: {
        authorityKey,
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        departemenId,
        holderId,
      },
      update: {
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        departemenId,
        holderId,
      },
    });
  }

  async resolveForProsesBisnis(prosesBisnisId: string): Promise<ResolvedPejabatBerwenang> {
    const process = await this.prisma.process.findUnique({
      where: { prosesBisnisId },
      select: { prosesBisnisId: true, nama: true, scope: true, departemenId: true },
    });
    if (process === null) {
      throw new NotFoundException('Proses Bisnis tidak ditemukan');
    }

    const authority = process.scope === LingkupOrganisasi.FACULTY
      ? PejabatBerwenang.DEAN
      : PejabatBerwenang.HEAD_OF_DEPARTMENT;
    if (process.scope === LingkupOrganisasi.DEPARTMENT && process.departemenId === null) {
      throw new ConflictException('Proses Bisnis DEPARTMENT tidak memiliki konteks department');
    }
    const authorityKey = process.scope === LingkupOrganisasi.FACULTY
      ? this.deanKey()
      : this.departmentHeadKey(process.departemenId as string);

    const assignment = await this.prisma.organizationalAuthorityAssignment.findUnique({
      where: { authorityKey },
    });
    if (assignment === null) {
      throw new ConflictException(
        process.scope === LingkupOrganisasi.FACULTY
          ? 'Dean aktif belum dikonfigurasi'
          : 'Kepala Departemen aktif belum dikonfigurasi',
      );
    }
    if (
      assignment.authority !== authority ||
      assignment.departemenId !== process.departemenId
    ) {
      throw new ConflictException('Konfigurasi pejabat berwenang tidak konsisten');
    }
    const holder = await this.prisma.pengguna.findFirst({
      where: { penggunaId: assignment.holderId, deletedAt: null },
      select: { penggunaId: true, nama: true, nip: true, jabatan: true },
    });
    if (holder === null) {
      throw new ConflictException('Pemegang pejabat berwenang tidak aktif');
    }
    return {
      authorityKey,
      authority,
      departemenId: process.departemenId,
      holderId: holder.penggunaId,
      holderName: holder.nama,
      holderNip: holder.nip,
      holderJabatan: holder.jabatan,
      prosesBisnisId: process.prosesBisnisId,
      namaProsesBisnis: process.nama,
      scope: process.scope,
    };
  }

  async assertCanApprove(userId: string, prosesBisnisId: string): Promise<ResolvedPejabatBerwenang> {
    const resolved = await this.resolveForProsesBisnis(prosesBisnisId);
    if (resolved.holderId !== userId) {
      throw new ForbiddenException('Anda bukan final approver untuk organizational scope Proses Bisnis ini');
    }
    return resolved;
  }

  deanKey(): string {
    return 'DEAN';
  }

  departmentHeadKey(departemenId: string): string {
    return `HEAD_OF_DEPARTMENT:${departemenId}`;
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const exists = await this.prisma.pengguna.count({ where: { penggunaId: userId, deletedAt: null } });
    if (exists !== 1) {
      throw new NotFoundException('Pengguna aktif tidak ditemukan');
    }
  }
}
