import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PejabatBerwenang, LingkupOrganisasi } from '../../../generated/prisma';

export interface ResolvedPejabatBerwenang {
  kunciPejabatBerwenang: string;
  authority: PejabatBerwenang;
  departemenId: string | null;
  holderId: string;
  holderName: string;
  holderNip: string;
  holderJabatan: string;
  prosesBisnisId: string;
  namaProsesBisnis: string;
  lingkup: LingkupOrganisasi;
}

@Injectable()
export class PejabatBerwenangService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    return this.prisma.penugasanPejabatBerwenang.findMany({
      where: { holderId: userId },
      orderBy: { kunciPejabatBerwenang: 'asc' },
    });
  }

  async listConfiguration() {
    const assignments = await this.prisma.penugasanPejabatBerwenang.findMany({
      orderBy: { kunciPejabatBerwenang: 'asc' },
    });
    const holderIds = [...new Set(assignments.map((assignment) => assignment.holderId))];
    const departemenIds = [...new Set(assignments.flatMap((assignment) => assignment.departemenId ? [assignment.departemenId] : []))];
    const [holders, departemen] = await Promise.all([
      this.prisma.pengguna.findMany({
        where: { penggunaId: { in: holderIds } },
        select: { penggunaId: true, nama: true, email: true, deletedAt: true },
      }),
      this.prisma.departemen.findMany({
        where: { departemenId: { in: departemenIds } },
        select: { departemenId: true, nama: true },
      }),
    ]);
    const holderById = new Map(holders.map((holder) => [holder.penggunaId, holder]));
    const departmentById = new Map(departemen.map((department) => [department.departemenId, department]));
    return assignments.map((assignment) => ({
      ...assignment,
      holder: holderById.get(assignment.holderId) ?? null,
      departemen: assignment.departemenId ? departmentById.get(assignment.departemenId) ?? null : null,
    }));
  }

  async assignDean(holderId: string) {
    await this.assertActiveUser(holderId);
    return this.prisma.penugasanPejabatBerwenang.upsert({
      where: { kunciPejabatBerwenang: this.deanKey() },
      create: {
        kunciPejabatBerwenang: this.deanKey(),
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
      this.prisma.departemen.findUnique({ where: { departemenId }, select: { departemenId: true } }),
      this.assertActiveUser(holderId),
    ]);
    if (department === null) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }
    const kunciPejabatBerwenang = this.departmentHeadKey(departemenId);
    return this.prisma.penugasanPejabatBerwenang.upsert({
      where: { kunciPejabatBerwenang },
      create: {
        kunciPejabatBerwenang,
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
    const prosesBisnis = await this.prisma.prosesBisnis.findUnique({
      where: { prosesBisnisId },
      select: { prosesBisnisId: true, nama: true, lingkup: true, departemenId: true },
    });
    if (prosesBisnis === null) {
      throw new NotFoundException('Proses Bisnis tidak ditemukan');
    }

    const authority = prosesBisnis.lingkup === LingkupOrganisasi.FACULTY
      ? PejabatBerwenang.DEAN
      : PejabatBerwenang.HEAD_OF_DEPARTMENT;
    if (prosesBisnis.lingkup === LingkupOrganisasi.DEPARTMENT && prosesBisnis.departemenId === null) {
      throw new ConflictException('Proses Bisnis DEPARTMENT tidak memiliki konteks department');
    }
    const kunciPejabatBerwenang = prosesBisnis.lingkup === LingkupOrganisasi.FACULTY
      ? this.deanKey()
      : this.departmentHeadKey(prosesBisnis.departemenId as string);

    const assignment = await this.prisma.penugasanPejabatBerwenang.findUnique({
      where: { kunciPejabatBerwenang },
    });
    if (assignment === null) {
      throw new ConflictException(
        prosesBisnis.lingkup === LingkupOrganisasi.FACULTY
          ? 'Dean aktif belum dikonfigurasi'
          : 'Kepala Departemen aktif belum dikonfigurasi',
      );
    }
    if (
      assignment.authority !== authority ||
      assignment.departemenId !== prosesBisnis.departemenId
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
      kunciPejabatBerwenang,
      authority,
      departemenId: prosesBisnis.departemenId,
      holderId: holder.penggunaId,
      holderName: holder.nama,
      holderNip: holder.nip,
      holderJabatan: holder.jabatan,
      prosesBisnisId: prosesBisnis.prosesBisnisId,
      namaProsesBisnis: prosesBisnis.nama,
      lingkup: prosesBisnis.lingkup,
    };
  }

  async assertCanApprove(userId: string, prosesBisnisId: string): Promise<ResolvedPejabatBerwenang> {
    const resolved = await this.resolveForProsesBisnis(prosesBisnisId);
    if (resolved.holderId !== userId) {
      throw new ForbiddenException('Anda bukan final approver untuk organizational lingkup Proses Bisnis ini');
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
