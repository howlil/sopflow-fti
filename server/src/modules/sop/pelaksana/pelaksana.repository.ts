import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type PelaksanaRow = {
  pelaksanaId: string;
  nama: string;
  createdAt: Date;
  updatedAt: Date;
};

const pelaksanaSelect = {
  pelaksanaId: true,
  nama: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PelaksanaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PelaksanaRow[]> {
    return this.prisma.pelaksana.findMany({ select: pelaksanaSelect, orderBy: { nama: 'asc' } });
  }

  async findById(pelaksanaId: string): Promise<PelaksanaRow | null> {
    return this.prisma.pelaksana.findUnique({ where: { pelaksanaId }, select: pelaksanaSelect });
  }

  async findByNama(nama: string): Promise<Pick<PelaksanaRow, 'pelaksanaId' | 'nama'> | null> {
    return this.prisma.pelaksana.findUnique({
      where: { nama },
      select: { pelaksanaId: true, nama: true },
    });
  }

  async createGlobal(nama: string): Promise<PelaksanaRow> {
    return this.prisma.pelaksana.create({ data: { nama }, select: pelaksanaSelect });
  }

  async updateNamaGlobal(pelaksanaId: string, nama: string): Promise<PelaksanaRow> {
    return this.prisma.pelaksana.update({
      where: { pelaksanaId },
      data: { nama },
      select: pelaksanaSelect,
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
