import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

const peraturanSelect = {
  peraturanId: true,
  nama: true,
  nomor: true,
  tahun: true,
  tentang: true,
  lastEditedById: true,
  lastEditedBy: {
    select: { penggunaId: true, nama: true },
  },
  createdAt: true,
  updatedAt: true,
  _count: { select: { dasarHukum: true } },
} as const;

export type PeraturanRow = {
  peraturanId: string;
  nama: string;
  nomor: string;
  tahun: number;
  tentang: string;
  lastEditedById: string | null;
  lastEditedBy: null | { penggunaId: string; nama: string };
  createdAt: Date;
  updatedAt: Date;
  dasarHukumCount: number;
};

@Injectable()
export class PeraturanRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: {
    peraturanId: string;
    nama: string;
    nomor: string;
    tahun: number;
    tentang: string;
    lastEditedById: string | null;
    lastEditedBy: { penggunaId: string; nama: string } | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { dasarHukum: number };
  }): PeraturanRow {
    return {
      peraturanId: row.peraturanId,
      nama: row.nama,
      nomor: row.nomor,
      tahun: row.tahun,
      tentang: row.tentang,
      lastEditedById: row.lastEditedById ?? null,
      lastEditedBy: row.lastEditedBy ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dasarHukumCount: row._count.dasarHukum,
    };
  }

  async findMany(): Promise<PeraturanRow[]> {
    const rows = await this.prisma.peraturan.findMany({
      select: peraturanSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async findById(peraturanId: string): Promise<PeraturanRow | null> {
    const row = await this.prisma.peraturan.findUnique({
      where: { peraturanId },
      select: peraturanSelect,
    });
    return row === null ? null : this.mapRow(row);
  }

  async countDasarHukum(peraturanId: string): Promise<number> {
    return this.prisma.dasarHukum.count({ where: { peraturanId } });
  }

  async create(params: {
    nama: string;
    nomor: string;
    tahun: number;
    tentang: string;
    lastEditedById: string;
  }): Promise<PeraturanRow> {
    const created = await this.prisma.peraturan.create({
      data: {
        nama: params.nama,
        nomor: params.nomor,
        tahun: params.tahun,
        tentang: params.tentang,
        lastEditedById: params.lastEditedById,
      },
      select: peraturanSelect,
    });
    return this.mapRow(created);
  }

  async update(
    peraturanId: string,
    data: { nama?: string; nomor?: string; tahun?: number; tentang?: string },
    lastEditedById: string,
  ): Promise<PeraturanRow> {
    const updated = await this.prisma.peraturan.update({
      where: { peraturanId },
      data: { ...data, lastEditedById },
      select: peraturanSelect,
    });
    return this.mapRow(updated);
  }

  async delete(peraturanId: string): Promise<void> {
    await this.prisma.peraturan.delete({ where: { peraturanId } });
  }
}
