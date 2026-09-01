import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type PelaksanaRow = {
  pelaksanaId: string;
  opdId: string;
  nama: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PelaksanaAttributionRow = {
  pelaksanaId: string;
  createdById: string | null;
  updatedById: string | null;
};

@Injectable()
export class PelaksanaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Legacy OPD is retained only as the required storage shadow while migration is in progress. */
  async findLegacyOpdShadowByPenggunaId(penggunaId: string): Promise<string | null> {
    const row = await this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: { opdId: true },
    });
    return row?.opdId ?? null;
  }

  async findAll(): Promise<PelaksanaRow[]> {
    return this.prisma.pelaksana.findMany({
      select: {
        pelaksanaId: true,
        opdId: true,
        nama: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nama: 'asc' },
    });
  }

  async findById(pelaksanaId: string): Promise<PelaksanaRow | null> {
    return this.prisma.pelaksana.findUnique({
      where: { pelaksanaId },
      select: {
        pelaksanaId: true,
        opdId: true,
        nama: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByNama(nama: string): Promise<Pick<PelaksanaRow, 'pelaksanaId' | 'nama'> | null> {
    return this.prisma.pelaksana.findFirst({
      where: { nama },
      select: { pelaksanaId: true, nama: true },
    });
  }

  async findAttributionByPelaksanaIds(ids: string[]): Promise<PelaksanaAttributionRow[]> {
    if (ids.length === 0) return [];
    return this.prisma.pelaksanaAuditAttribution.findMany({
      where: { pelaksanaId: { in: ids } },
      select: { pelaksanaId: true, createdById: true, updatedById: true },
    });
  }

  async findPenggunaNames(ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids.filter((id) => id.length > 0)));
    if (uniqueIds.length === 0) return new Map();
    const rows = await this.prisma.pengguna.findMany({
      where: { penggunaId: { in: uniqueIds } },
      select: { penggunaId: true, nama: true },
    });
    return new Map(rows.map((row) => [row.penggunaId, row.nama]));
  }

  async createGlobal(opdShadowId: string, nama: string, userId: string): Promise<PelaksanaRow> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.pelaksana.create({
        data: { opdId: opdShadowId, nama },
        select: {
          pelaksanaId: true,
          opdId: true,
          nama: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await tx.pelaksanaAuditAttribution.create({
        data: {
          pelaksanaId: row.pelaksanaId,
          createdById: userId,
          updatedById: userId,
        },
      });
      return row;
    });
  }

  async updateNamaGlobal(pelaksanaId: string, nama: string, userId: string): Promise<PelaksanaRow> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.pelaksana.update({
        where: { pelaksanaId },
        data: { nama },
        select: {
          pelaksanaId: true,
          opdId: true,
          nama: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await tx.pelaksanaAuditAttribution.upsert({
        where: { pelaksanaId },
        create: { pelaksanaId, updatedById: userId },
        update: { updatedById: userId },
      });
      return row;
    });
  }

  async delete(pelaksanaId: string): Promise<void> {
    await this.prisma.pelaksana.delete({ where: { pelaksanaId } });
  }

  async countLangkahReferences(pelaksanaId: string): Promise<number> {
    return this.prisma.langkahSOP.count({ where: { pelaksanaId } });
  }

  async countSwimlaneReferences(pelaksanaId: string): Promise<number> {
    return this.prisma.detailSOPPelaksana.count({ where: { pelaksanaId } });
  }
}
