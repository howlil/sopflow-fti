import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessLifecycleStatus } from '../../../generated/prisma';

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
export class ProcessContextService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(penggunaId: string) {
    const archivedIds = await this.archivedProcessIds();
    return this.prisma.process.findMany({
      where: {
        ...(archivedIds.length > 0 ? { processId: { notIn: archivedIds } } : {}),
        OR: [{ ownerId: penggunaId }, { members: { some: { penggunaId } } }],
      },
      include: processInclude,
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
  }

  async assertCanAuthor(penggunaId: string, processId: string) {
    if (await this.isArchived(processId)) {
      throw new ForbiddenException('Process sudah diarsipkan dan bersifat read-only');
    }
    const process = await this.prisma.process.findFirst({
      where: {
        processId,
        OR: [{ ownerId: penggunaId }, { members: { some: { penggunaId } } }],
      },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Akses ditolak: pengguna bukan Process Owner atau Process Member');
    }
    return process;
  }

  async assertCanReview(penggunaId: string, processId: string) {
    if (await this.isArchived(processId)) {
      throw new ForbiddenException('Process sudah diarsipkan dan tidak menerima tindakan workflow baru');
    }
    const process = await this.prisma.process.findFirst({
      where: { processId, ownerId: penggunaId },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Akses ditolak: hanya Process Owner yang dapat melakukan review');
    }
    return process;
  }

  private async archivedProcessIds(): Promise<string[]> {
    const rows = await this.prisma.processLifecycle.findMany({
      where: { status: ProcessLifecycleStatus.ARCHIVED },
      select: { processId: true },
    });
    return rows.map((row) => row.processId);
  }

  private async isArchived(processId: string): Promise<boolean> {
    const lifecycle = await this.prisma.processLifecycle.findUnique({
      where: { processId },
      select: { status: true },
    });
    return lifecycle?.status === ProcessLifecycleStatus.ARCHIVED;
  }
}
