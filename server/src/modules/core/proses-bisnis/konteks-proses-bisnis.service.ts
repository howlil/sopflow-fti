import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusKeaktifanProsesBisnis } from '../../../generated/prisma';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  platformRole: true,
} as const;

const prosesBisnisInclude = {
  departemen: true,
  penanggungJawab: { select: userSelect },
  anggota: {
    include: { pengguna: { select: userSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class ProsesBisnisContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Semua Proses Bisnis tempat pengguna mempunyai tanggung jawab aktif, baik
   * sebagai Penanggung Jawab maupun Anggota. Gunakan ini untuk navigasi/konteks
   * umum, bukan sebagai authoring authorization.
   */
  async listForUser(penggunaId: string) {
    const archivedIds = await this.archivedProsesBisnisIds();
    return this.prisma.prosesBisnis.findMany({
      where: {
        ...(archivedIds.length > 0 ? { prosesBisnisId: { notIn: archivedIds } } : {}),
        OR: [{ penanggungJawabId: penggunaId }, { anggota: { some: { penggunaId } } }],
      },
      include: prosesBisnisInclude,
      orderBy: [{ lingkup: 'asc' }, { nama: 'asc' }],
    });
  }

  /** Authoring SOP hanya untuk Anggota Proses Bisnis/Penyusun SOP. */
  async listAuthoringForUser(penggunaId: string) {
    const archivedIds = await this.archivedProsesBisnisIds();
    return this.prisma.prosesBisnis.findMany({
      where: {
        ...(archivedIds.length > 0 ? { prosesBisnisId: { notIn: archivedIds } } : {}),
        anggota: { some: { penggunaId } },
      },
      include: prosesBisnisInclude,
      orderBy: [{ lingkup: 'asc' }, { nama: 'asc' }],
    });
  }

  /**
   * Katalog Peraturan/Pelaksana bersifat global, tetapi hanya pengguna yang
   * sedang menjadi Penanggung Jawab atau Anggota Proses Bisnis aktif yang boleh
   * memutasi katalog tersebut.
   */
  async assertCanManageGlobalCatalog(penggunaId: string): Promise<void> {
    const archivedIds = await this.archivedProsesBisnisIds();
    const prosesBisnis = await this.prisma.prosesBisnis.findFirst({
      where: {
        ...(archivedIds.length > 0 ? { prosesBisnisId: { notIn: archivedIds } } : {}),
        OR: [{ penanggungJawabId: penggunaId }, { anggota: { some: { penggunaId } } }],
      },
      select: { prosesBisnisId: true },
    });
    if (prosesBisnis === null) {
      throw new ForbiddenException(
        'Akses ditolak: katalog global hanya dapat dikelola Penanggung Jawab atau Anggota Proses Bisnis aktif',
      );
    }
  }

  async assertCanAuthor(penggunaId: string, prosesBisnisId: string) {
    if (await this.isArchived(prosesBisnisId)) {
      throw new ForbiddenException('Proses Bisnis sudah diarsipkan dan bersifat read-only');
    }
    const prosesBisnis = await this.prisma.prosesBisnis.findFirst({
      where: {
        prosesBisnisId,
        anggota: { some: { penggunaId } },
      },
      include: prosesBisnisInclude,
    });
    if (prosesBisnis === null) {
      throw new ForbiddenException(
        'Akses ditolak: hanya Anggota Proses Bisnis/Penyusun SOP yang dapat membuat atau mengedit SOP',
      );
    }
    return prosesBisnis;
  }

  async assertCanReview(penggunaId: string, prosesBisnisId: string) {
    if (await this.isArchived(prosesBisnisId)) {
      throw new ForbiddenException('Proses Bisnis sudah diarsipkan dan tidak menerima tindakan workflow baru');
    }
    const prosesBisnis = await this.prisma.prosesBisnis.findFirst({
      where: { prosesBisnisId, penanggungJawabId: penggunaId },
      include: prosesBisnisInclude,
    });
    if (prosesBisnis === null) {
      throw new ForbiddenException(
        'Akses ditolak: hanya Penanggung Jawab Proses Bisnis yang dapat melakukan pemeriksaan',
      );
    }
    return prosesBisnis;
  }

  private async archivedProsesBisnisIds(): Promise<string[]> {
    const rows = await this.prisma.statusProsesBisnis.findMany({
      where: { status: StatusKeaktifanProsesBisnis.ARCHIVED },
      select: { prosesBisnisId: true },
    });
    return rows.map((row) => row.prosesBisnisId);
  }

  private async isArchived(prosesBisnisId: string): Promise<boolean> {
    const siklus = await this.prisma.statusProsesBisnis.findUnique({
      where: { prosesBisnisId },
      select: { status: true },
    });
    return siklus?.status === StatusKeaktifanProsesBisnis.ARCHIVED;
  }
}
