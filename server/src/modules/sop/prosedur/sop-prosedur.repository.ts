import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma';
import { BagianSOP, JenisLangkahProsedur, SatuanWaktu } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';

export interface RepoLangkahPatchItem {
  tempId: string;
  jenis: JenisLangkahProsedur;
  kegiatan: string;
  kelengkapan?: string;
  keluaran?: string;
  waktu?: number;
  satuanWaktu?: SatuanWaktu;
  keterangan?: string;
  pelaksanaId?: string | null;
  langkahSelanjutnyaYaTempId?: string | null;
  langkahSelanjutnyaTidakTempId?: string | null;
}

export interface RepoPelaksanaPatchItem {
  pelaksanaId: string;
  namaSnapshot: string;
}

export interface UpdateSopProsedurRepoInput {
  pelaksana?: RepoPelaksanaPatchItem[];
  langkah?: RepoLangkahPatchItem[];
  defaultPelaksanaId?: string | null;
}

@Injectable()
export class SopProsedurRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDetailIdByDetailOrSopId(
    detailOrSopId: string,
  ): Promise<{ detailSopId: string; sopId: string; processId: string | null } | null> {
    const direct = await this.prisma.detailSOP.findUnique({
      where: { detailSopId: detailOrSopId },
      select: { detailSopId: true, sopId: true, sop: { select: { processId: true } } },
    });
    if (direct !== null) {
      return {
        detailSopId: direct.detailSopId,
        sopId: direct.sopId,
        processId: direct.sop.processId,
      };
    }
    const header = await this.prisma.sOP.findUnique({
      where: { sopId: detailOrSopId },
      select: {
        sopId: true,
        processId: true,
        detailSops: {
          orderBy: { versi: 'desc' },
          take: 1,
          select: { detailSopId: true },
        },
      },
    });
    const latest = header?.detailSops[0]?.detailSopId;
    if (header === null || latest === undefined) return null;
    return { detailSopId: latest, sopId: header.sopId, processId: header.processId };
  }

  async findProcessIdBySopId(sopId: string): Promise<string | null> {
    const row = await this.prisma.sOP.findUnique({
      where: { sopId },
      select: { processId: true },
    });
    return row?.processId ?? null;
  }

  async findDetailStatus(
    detailSopId: string,
  ): Promise<import('../../../generated/prisma').StatusSOP | null> {
    const row = await this.prisma.detailSOP.findUnique({
      where: { detailSopId },
      select: { status: true },
    });
    return row?.status ?? null;
  }

  async findGlobalPelaksana(ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return new Map();
    const rows = await this.prisma.pelaksana.findMany({
      where: { pelaksanaId: { in: uniqueIds } },
      select: { pelaksanaId: true, nama: true },
    });
    return new Map(rows.map((row) => [row.pelaksanaId, row.nama]));
  }

  async findExistingSwimlanePelaksanaIds(detailSopId: string): Promise<string[]> {
    const rows = await this.prisma.detailSOPPelaksana.findMany({
      where: { detailSopId },
      select: { pelaksanaId: true },
      orderBy: { urutan: 'asc' },
    });
    return rows.map((row) => row.pelaksanaId);
  }

  async findExistingLangkahPelaksanaIds(detailSopId: string): Promise<string[]> {
    const rows = await this.prisma.langkahSOP.findMany({
      where: { detailSopId },
      select: { pelaksanaId: true },
      distinct: ['pelaksanaId'],
    });
    return rows.map((row) => row.pelaksanaId);
  }

  async updateProsedurTransaction(params: {
    detailSopId: string;
    userId: string;
    input: UpdateSopProsedurRepoInput;
    changedFields: string[];
  }): Promise<void> {
    const { detailSopId, userId, input, changedFields } = params;
    await this.prisma.$transaction(async (tx) => {
      if (input.langkah !== undefined) {
        await this.clearLangkahInTx(tx, detailSopId);
      }

      if (input.pelaksana !== undefined) {
        await tx.detailSOPPelaksanaSnapshot.deleteMany({ where: { detailSopId } });
        await tx.detailSOPPelaksana.deleteMany({ where: { detailSopId } });
        if (input.pelaksana.length > 0) {
          await tx.detailSOPPelaksana.createMany({
            data: input.pelaksana.map((item, index) => ({
              detailSopId,
              pelaksanaId: item.pelaksanaId,
              urutan: index + 1,
            })),
          });
          await tx.detailSOPPelaksanaSnapshot.createMany({
            data: input.pelaksana.map((item) => ({
              detailSopId,
              pelaksanaId: item.pelaksanaId,
              namaSnapshot: item.namaSnapshot,
            })),
          });
        }
      }

      if (input.langkah !== undefined) {
        await this.createLangkahInTx(tx, detailSopId, input);
      }

      await tx.detailSOP.update({
        where: { detailSopId },
        data: { terakhirDieditOlehId: userId },
      });

      await appendOrCreateLogSession({
        tx,
        detailSopId,
        penggunaId: userId,
        bagian: BagianSOP.LANGKAH,
        fields: changedFields,
      });
    });
  }

  private async clearLangkahInTx(
    tx: Prisma.TransactionClient,
    detailSopId: string,
  ): Promise<void> {
    const existingCount = await tx.langkahSOP.count({ where: { detailSopId } });
    if (existingCount === 0) return;
    await tx.langkahSOP.updateMany({
      where: { detailSopId },
      data: { langkahSelanjutnyaYaId: null, langkahSelanjutnyaTidakId: null },
    });
    await tx.langkahSOP.deleteMany({ where: { detailSopId } });
  }

  private async createLangkahInTx(
    tx: Prisma.TransactionClient,
    detailSopId: string,
    input: UpdateSopProsedurRepoInput,
  ): Promise<void> {
    const langkah = input.langkah ?? [];
    if (langkah.length === 0) return;

    const tempToId = new Map<string, string>();
    for (const [index, item] of langkah.entries()) {
      const id = randomUUID();
      tempToId.set(item.tempId, id);
      const pelaksanaId = item.pelaksanaId ?? input.defaultPelaksanaId ?? null;
      if (pelaksanaId === null) {
        throw new Error(
          'pelaksanaId tidak dapat diresolusi untuk langkah; pilih actor pada swimlane terlebih dahulu',
        );
      }
      await tx.langkahSOP.create({
        data: {
          langkahSopId: id,
          detailSopId,
          urutan: index + 1,
          jenis: item.jenis,
          kegiatan: item.kegiatan,
          kelengkapan: item.kelengkapan ?? '',
          keluaran: item.keluaran ?? '',
          waktu: item.waktu ?? 0,
          satuanWaktu: item.satuanWaktu ?? SatuanWaktu.m,
          keterangan: item.keterangan ?? '',
          pelaksanaId,
        },
      });
    }

    for (const item of langkah) {
      const sourceId = tempToId.get(item.tempId);
      if (sourceId === undefined) continue;
      const ya = item.langkahSelanjutnyaYaTempId
        ? (tempToId.get(item.langkahSelanjutnyaYaTempId) ?? null)
        : null;
      const tidak = item.langkahSelanjutnyaTidakTempId
        ? (tempToId.get(item.langkahSelanjutnyaTidakTempId) ?? null)
        : null;
      if (ya === null && tidak === null) continue;
      await tx.langkahSOP.update({
        where: { langkahSopId: sourceId },
        data: { langkahSelanjutnyaYaId: ya, langkahSelanjutnyaTidakId: tidak },
      });
    }
  }
}
