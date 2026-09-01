import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  peran: true,
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

  listForUser(penggunaId: string) {
    return this.prisma.process.findMany({
      where: {
        OR: [{ ownerId: penggunaId }, { members: { some: { penggunaId } } }],
      },
      include: processInclude,
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
  }

  async assertCanAuthor(penggunaId: string, processId: string) {
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
}
