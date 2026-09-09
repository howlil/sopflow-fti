import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PlatformRole } from '../../../generated/prisma';

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
}
