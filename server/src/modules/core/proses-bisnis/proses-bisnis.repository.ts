import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlatformRole } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  nip: true,

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

  async listMemberDirectory() {
    const prosesBisnis = await this.listProsesBisnis();
    if (prosesBisnis.length === 0) return prosesBisnis.map((row) => ({ ...row, undangan: [] }));
    const invitations = await this.prisma.undanganAnggotaProsesBisnis.findMany({
      where: { prosesBisnisId: { in: prosesBisnis.map((row) => row.prosesBisnisId) } },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        undanganAnggotaProsesBisnisId: true,
        prosesBisnisId: true,
        email: true,
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
        nohp: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const byProcess = new Map<string, typeof invitations>();
    for (const invitation of invitations) {
      byProcess.set(invitation.prosesBisnisId, [...(byProcess.get(invitation.prosesBisnisId) ?? []), invitation]);
    }
    return prosesBisnis.map((row) => ({ ...row, undangan: byProcess.get(row.prosesBisnisId) ?? [] }));
  }

  findActiveUser(penggunaId: string) {
    return this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: { penggunaId: true, platformRole: true },
    });
  }

  findMemberMembership(penggunaId: string, prosesBisnisId?: string) {
    return this.prisma.anggotaProsesBisnis.findFirst({
      where: { penggunaId, ...(prosesBisnisId ? { prosesBisnisId } : {}) },
      select: { prosesBisnisId: true, penggunaId: true },
    });
  }

  findProsesBisnis(prosesBisnisId: string) {
    return this.prisma.prosesBisnis.findUnique({
      where: { prosesBisnisId },
      select: {
        prosesBisnisId: true,
        penanggungJawabId: true,
      },
    });
  }

  findProcessStatus(prosesBisnisId: string) {
    return this.prisma.statusProsesBisnis.findUnique({
      where: { prosesBisnisId },
      select: { status: true },
    });
  }

  transferMember(penggunaId: string, fromProsesBisnisId: string, targetProsesBisnisId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.anggotaProsesBisnis.delete({
        where: { prosesBisnisId_penggunaId: { prosesBisnisId: fromProsesBisnisId, penggunaId } },
      });
      return tx.anggotaProsesBisnis.create({
        data: { prosesBisnisId: targetProsesBisnisId, penggunaId },
      });
    });
  }
}
