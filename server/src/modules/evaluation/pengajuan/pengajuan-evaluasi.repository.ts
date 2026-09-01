import { Injectable } from '@nestjs/common';
import { displayStatusPengajuan } from '../../../common/status/status-display';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  JenisDokumenTte,
  type JenisPengajuanEvaluasi,
  Prisma,
  type StatusPengajuanEvaluasi,
  StatusPengajuanEvaluasi as StatusPengajuanEvaluasiEnum,
  type StatusSOP,
  StatusSOP as StatusSOPEnum,
} from '../../../generated/prisma';
import type { PengajuanEvaluasiListQueryDto } from './dto/pengajuan-evaluasi-list-query.dto';
import type { PengajuanEvaluasiRingkasQueryDto } from './dto/pengajuan-evaluasi-ringkas-query.dto';

const pengajuanEvaluasiDetailInclude = Prisma.validator<Prisma.PengajuanEvaluasiInclude>()({
  opd: { select: { opdId: true, nama: true } },
  nilaiEvaluasi: {
    include: {
      detailSop: {
        select: {
          detailSopId: true,
          nomorSOP: true,
          status: true,
          sop: { select: { sopId: true, judul: true } },
        },
      },
      dinilaiOleh: { select: { penggunaId: true, nama: true } },
    },
  },
  diselesaikanOleh: { select: { penggunaId: true, nama: true } },
  ditolakOleh: { select: { penggunaId: true, nama: true } },
  diverifikasiOlehUser: { select: { penggunaId: true, nama: true } },
  ditandatanganiOlehPjPenyusunUser: { select: { penggunaId: true, nama: true } },
  dokumenTte: {
    where: { jenisDokumen: JenisDokumenTte.BERITA_ACARA_EVALUASI },
    take: 1,
    orderBy: { createdAt: 'desc' },
    select: { nomorDokumen: true },
  },
  logNilaiEvaluasi: {
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      pengguna: { select: { nama: true } },
    },
  },
});

export type PengajuanEvaluasiDetailRow = Prisma.PengajuanEvaluasiGetPayload<{
  include: typeof pengajuanEvaluasiDetailInclude;
}>;

export type PengajuanTransactionFailure =
  | { readonly error: 'ACTIVE_EXISTS' }
  | { readonly error: 'DETAIL_NOT_FOUND'; readonly detailSopId: string }
  | {
      readonly error: 'DETAIL_BAD_STATUS';
      readonly detailSopId: string;
      readonly status: StatusSOP;
    }
  | { readonly error: 'STATUS_DRIFT' };

export type CreatePengajuanTransactionResult =
  | { readonly ok: true; readonly pengajuanEvaluasiId: string }
  | ({ readonly ok: false } & PengajuanTransactionFailure);

export type EnsurePengajuanTransactionResult =
  | {
      readonly ok: true;
      readonly created: boolean;
      readonly pengajuanEvaluasiId?: string;
    }
  | ({ readonly ok: false } & Exclude<PengajuanTransactionFailure, { error: 'ACTIVE_EXISTS' }>);

type CreatePengajuanTransactionParams = Readonly<{
  opdId: string;
  jenis: JenisPengajuanEvaluasi;
  sopDetailIds: readonly string[];
  activeStatuses: readonly StatusPengajuanEvaluasi[];
  eligibleDetailStatuses: readonly StatusSOP[];
}>;

class PengajuanTransactionAbort extends Error {
  constructor(readonly failure: PengajuanTransactionFailure) {
    super(failure.error);
    this.name = 'PengajuanTransactionAbort';
  }
}

@Injectable()
export class PengajuanEvaluasiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPengajuanDenganLock(
    params: CreatePengajuanTransactionParams,
  ): Promise<CreatePengajuanTransactionResult> {
    return this.executeCreatePengajuanDenganLock(params);
  }

  async ensurePengajuanRequestOpdDenganLock(
    params: CreatePengajuanTransactionParams,
  ): Promise<EnsurePengajuanTransactionResult> {
    const result = await this.executeCreatePengajuanDenganLock(params);
    if (!result.ok && result.error === 'ACTIVE_EXISTS') {
      return { ok: true, created: false };
    }
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      created: true,
      pengajuanEvaluasiId: result.pengajuanEvaluasiId,
    };
  }

  private async executeCreatePengajuanDenganLock(
    params: CreatePengajuanTransactionParams,
  ): Promise<CreatePengajuanTransactionResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw<Array<{ opdId: string }>>`
          SELECT opdId
          FROM OPD
          WHERE opdId = ${params.opdId}
          FOR UPDATE
        `;
        const blocking = await tx.pengajuanEvaluasi.findFirst({
          where: {
            opdId: params.opdId,
            status: { in: [...params.activeStatuses] },
          },
          select: { pengajuanEvaluasiId: true },
        });
        if (blocking !== null) {
          return { ok: false, error: 'ACTIVE_EXISTS' } as const;
        }
        const details = await tx.detailSOP.findMany({
          where: {
            detailSopId: { in: [...params.sopDetailIds] },
            sop: { opdId: params.opdId },
          },
          select: { detailSopId: true, status: true },
        });
        const detailById = new Map(details.map((detail) => [detail.detailSopId, detail]));
        const eligibleStatuses = new Set<StatusSOP>(params.eligibleDetailStatuses);
        for (const detailSopId of params.sopDetailIds) {
          const detail = detailById.get(detailSopId);
          if (detail === undefined) {
            return { ok: false, error: 'DETAIL_NOT_FOUND', detailSopId } as const;
          }
          if (!eligibleStatuses.has(detail.status)) {
            return {
              ok: false,
              error: 'DETAIL_BAD_STATUS',
              detailSopId,
              status: detail.status,
            } as const;
          }
        }
        const sekarang = new Date();
        const dibuat = await tx.pengajuanEvaluasi.create({
          data: {
            opdId: params.opdId,
            jenis: params.jenis,
            status: StatusPengajuanEvaluasiEnum.SEDANG_DIEVALUASI,
            tanggalPermintaan: sekarang,
            tanggalEvaluasi: sekarang,
            nilaiEvaluasi: {
              create: params.sopDetailIds.map((detailSopId) => ({ detailSopId })),
            },
          },
          select: { pengajuanEvaluasiId: true },
        });
        const promoted = await tx.detailSOP.updateMany({
          where: {
            detailSopId: { in: [...params.sopDetailIds] },
            status: { in: [...params.eligibleDetailStatuses] },
          },
          data: { status: StatusSOPEnum.SEDANG_DIEVALUASI },
        });
        if (promoted.count !== params.sopDetailIds.length) {
          throw new PengajuanTransactionAbort({ error: 'STATUS_DRIFT' });
        }
        return {
          ok: true,
          pengajuanEvaluasiId: dibuat.pengajuanEvaluasiId,
        } as const;
      });
    } catch (error) {
      if (error instanceof PengajuanTransactionAbort) {
        return { ok: false, ...error.failure };
      }
      throw error;
    }
  }

  async findOpdIdPengguna(penggunaId: string): Promise<string | null> {
    const row = await this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: { opdId: true },
    });
    return row?.opdId ?? null;
  }

  async findManyFiltered(
    whereInput: Prisma.PengajuanEvaluasiWhereInput,
  ): Promise<PengajuanEvaluasiDetailRow[]> {
    return this.prisma.pengajuanEvaluasi.findMany({
      where: whereInput,
      include: pengajuanEvaluasiDetailInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findByIdFull(pengajuanEvaluasiId: string): Promise<PengajuanEvaluasiDetailRow | null> {
    return this.prisma.pengajuanEvaluasi.findUnique({
      where: { pengajuanEvaluasiId },
      include: pengajuanEvaluasiDetailInclude,
    });
  }

  buildWhereFromQuery(
    query: PengajuanEvaluasiListQueryDto,
    forcedOpdId?: string,
  ): Prisma.PengajuanEvaluasiWhereInput {
    const and: Prisma.PengajuanEvaluasiWhereInput[] = [];
    if (forcedOpdId !== undefined) {
      and.push({ opdId: forcedOpdId });
    } else if (query.opdId !== undefined) {
      and.push({ opdId: query.opdId });
    }
    if (query.statusIn !== undefined && query.statusIn.length > 0) {
      and.push({ status: { in: [...query.statusIn] } });
    } else if (query.status !== undefined) {
      and.push({ status: query.status });
    }
    if (query.jenis !== undefined) {
      and.push({ jenis: query.jenis });
    }
    return and.length === 0 ? {} : { AND: and };
  }

  /** Filter daftar ringkas + pencarian nama OPD (substring). */
  buildWhereRingkasFromQuery(
    query: PengajuanEvaluasiRingkasQueryDto,
    forcedOpdId?: string,
  ): Prisma.PengajuanEvaluasiWhereInput {
    const listFilters = this.buildWhereFromQuery(
      {
        opdId: query.opdId,
        status: query.status,
        statusIn: query.statusIn,
        jenis: query.jenis,
      },
      forcedOpdId,
    );
    const parts: Prisma.PengajuanEvaluasiWhereInput[] = [];
    if ('AND' in listFilters && Array.isArray(listFilters.AND)) {
      parts.push(...listFilters.AND);
    } else if (Object.keys(listFilters).length > 0) {
      parts.push(listFilters);
    }
    const term = query.search?.trim();
    if (term !== undefined && term.length > 0) {
      parts.push({ opd: { nama: { contains: term } } });
    }
    return parts.length === 0 ? {} : { AND: parts };
  }

  async countWhere(where: Prisma.PengajuanEvaluasiWhereInput): Promise<number> {
    return this.prisma.pengajuanEvaluasi.count({ where });
  }

  async findRingkasPage(
    where: Prisma.PengajuanEvaluasiWhereInput,
    skip: number,
    take: number,
  ): Promise<
    {
      pengajuanEvaluasiId: string;
      opdId: string;
      opdNama: string;
      jenis: string;
      status: string;
      statusLabel: string;
      tanggalEvaluasi?: string;
      createdAt: string;
      nilaiOPD?: number;
      jumlahSop: number;
      jumlahSudahDinilai: number;
    }[]
  > {
    const rows = await this.prisma.pengajuanEvaluasi.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        pengajuanEvaluasiId: true,
        opdId: true,
        jenis: true,
        status: true,
        tanggalEvaluasi: true,
        createdAt: true,
        nilaiOPD: true,
        opd: { select: { nama: true } },
      },
    });
    const ids = rows.map((row) => row.pengajuanEvaluasiId);
    if (ids.length === 0) {
      return [];
    }
    const [totals, filled] = await Promise.all([
      this.prisma.nilaiEvaluasi.groupBy({
        by: ['pengajuanEvaluasiId'],
        where: { pengajuanEvaluasiId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.nilaiEvaluasi.groupBy({
        by: ['pengajuanEvaluasiId'],
        where: {
          pengajuanEvaluasiId: { in: ids },
          hasil: { not: null },
        },
        _count: { _all: true },
      }),
    ]);
    const totalMap = new Map(totals.map((total) => [total.pengajuanEvaluasiId, total._count._all]));
    const filledMap = new Map(filled.map((item) => [item.pengajuanEvaluasiId, item._count._all]));
    return rows.map((row) => {
      const statusDisplay = displayStatusPengajuan(row.status);
      return {
        pengajuanEvaluasiId: row.pengajuanEvaluasiId,
        opdId: row.opdId,
        opdNama: row.opd.nama,
        jenis: String(row.jenis),
        status: statusDisplay.value,
        statusLabel: statusDisplay.label,
        tanggalEvaluasi: row.tanggalEvaluasi?.toISOString(),
        createdAt: row.createdAt.toISOString(),
        nilaiOPD: row.nilaiOPD ?? undefined,
        jumlahSop: totalMap.get(row.pengajuanEvaluasiId) ?? 0,
        jumlahSudahDinilai: filledMap.get(row.pengajuanEvaluasiId) ?? 0,
      };
    });
  }
}
