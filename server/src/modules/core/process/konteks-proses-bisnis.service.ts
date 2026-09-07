import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusKeaktifanProsesBisnis } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  platformRole: true,
} as const;

const processInclude = {
  department: true,
  owner: { select: userSelect },
  members: {
    include: { pengguna: { select: userSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class ProsesBisnisContextService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(penggunaId: string) {
    const archivedIds = await this.archivedProsesBisnisIds();
    return this.prisma.prosesBisnis.findMany({
      where: {
        ...(archivedIds.length > 0 ? { prosesBisnisId: { notIn: archivedIds } } : {}),
        OR: [{ ownerId: penggunaId }, { members: { some: { penggunaId } } }],
      },
      include: processInclude,
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
  }

  async assertCanAuthor(penggunaId: string, prosesBisnisId: string) {
    if (await this.isArchived(prosesBisnisId)) {
      throw new ForbiddenException('Proses Bisnis sudah diarsipkan dan bersifat read-only');
    }
    const process = await this.prisma.prosesBisnis.findFirst({
      where: {
        prosesBisnisId,
        OR: [{ ownerId: penggunaId }, { members: { some: { penggunaId } } }],
      },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Akses ditolak: pengguna bukan Penanggung Jawab Proses Bisnis atau Anggota Proses Bisnis');
    }
    return process;
  }

  async assertCanReview(penggunaId: string, prosesBisnisId: string) {
    if (await this.isArchived(prosesBisnisId)) {
      throw new ForbiddenException('Proses Bisnis sudah diarsipkan dan tidak menerima tindakan workflow baru');
    }
    const process = await this.prisma.prosesBisnis.findFirst({
      where: { prosesBisnisId, ownerId: penggunaId },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Akses ditolak: hanya Penanggung Jawab Proses Bisnis yang dapat melakukan review');
    }
    return process;
  }

  private async archivedProsesBisnisIds(): Promise<string[]> {
    const rows = await this.prisma.statusProsesBisnis.findMany({
      where: { status: StatusKeaktifanProsesBisnis.ARCHIVED },
      select: { prosesBisnisId: true },
    });
    return rows.map((row) => row.prosesBisnisId);
  }

  private async isArchived(prosesBisnisId: string): Promise<boolean> {
    const lifecycle = await this.prisma.statusProsesBisnis.findUnique({
      where: { prosesBisnisId },
      select: { status: true },
    });
    return lifecycle?.status === StatusKeaktifanProsesBisnis.ARCHIVED;
  }
}
