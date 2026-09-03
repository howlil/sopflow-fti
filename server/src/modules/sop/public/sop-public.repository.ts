import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  JenisDokumenTte,
  OrganizationalScope,
  Prisma,
  StatusSOP,
} from '../../../generated/prisma';

export type PublicOpdDbRow = {
  readonly opdId: string;
  readonly nama: string;
  readonly jumlahSopBerlaku: number;
};

export type PublicProcessDbRow = {
  readonly processId: string;
  readonly nama: string;
  readonly scope: OrganizationalScope;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly jumlahSopBerlaku: number;
};

export type PublicSopDbRow = {
  readonly detailSopId: string;
  readonly sopId: string;
  readonly opdId: string;
  readonly judul: string;
  readonly nomorSOP: string;
  readonly versi: number;
  readonly tanggalEfektif: Date | null;
  readonly opdNama: string;
  readonly pdfPath: string;
};

export type PublicFtiSopDbRow = PublicSopDbRow & {
  readonly processId: string | null;
  readonly processName: string | null;
  readonly scope: OrganizationalScope | null;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
};

export type PublicSopPdfDbRow = {
  readonly detailSopId: string;
  readonly judul: string;
  readonly nomorSOP: string;
  readonly versi: number;
  readonly pdfPath: string;
  readonly pdfSha256: string | null;
};

@Injectable()
export class SopPublicRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOpdAktifById(opdId: string): Promise<{ opdId: string; nama: string } | null> {
    return this.prisma.oPD.findFirst({
      where: { opdId, deletedAt: null },
      select: { opdId: true, nama: true },
    });
  }

  async countOpdWithBerlakuSop(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT o.opdId) AS total
      FROM OPD o
      WHERE o.deletedAt IS NULL
        ${search ? Prisma.sql`AND o.nama LIKE ${`%${search}%`}` : Prisma.empty}
        AND EXISTS (
          SELECT 1
          FROM SOP s
          JOIN DetailSOP d ON d.sopId = s.sopId
          JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
          WHERE s.opdId = o.opdId
            AND d.status = ${StatusSOP.BERLAKU}
            AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
            AND dt.pdfStatus = ${'PUBLISHED'}
            AND dt.pdfPath IS NOT NULL
        )
    `;
    return this.toCount(rows);
  }

  async findOpdWithBerlakuSop(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicOpdDbRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ opdId: string; nama: string; jumlahSopBerlaku: bigint | number }>
    >`
      SELECT o.opdId, o.nama, COUNT(DISTINCT s.sopId) AS jumlahSopBerlaku
      FROM OPD o
      JOIN SOP s ON s.opdId = o.opdId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE o.deletedAt IS NULL
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${params.search ? Prisma.sql`AND o.nama LIKE ${`%${params.search}%`}` : Prisma.empty}
      GROUP BY o.opdId, o.nama
      ORDER BY o.nama ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `;
    return rows.map((row) => ({
      opdId: row.opdId,
      nama: row.nama,
      jumlahSopBerlaku: Number(row.jumlahSopBerlaku),
    }));
  }

  async countBerlakuSopByOpd(opdId: string, search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      JOIN OPD o ON o.opdId = s.opdId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE s.opdId = ${opdId}
        AND o.deletedAt IS NULL
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.searchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findBerlakuSopByOpd(params: {
    opdId: string;
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicSopDbRow[]> {
    return this.findPublishedSopRows(
      Prisma.sql`s.opdId = ${params.opdId}`,
      params.search,
      params.skip,
      params.take,
    );
  }

  async countBerlakuSopGlobal(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      JOIN OPD o ON o.opdId = s.opdId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE o.deletedAt IS NULL
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.searchSql(search, true)}
    `;
    return this.toCount(rows);
  }

  async findBerlakuSopGlobal(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicSopDbRow[]> {
    return this.findPublishedSopRows(
      Prisma.sql`1 = 1`,
      params.search,
      params.skip,
      params.take,
      true,
    );
  }

  async countProcessWithBerlakuSop(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT p.processId) AS total
      FROM Process p
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN ProcessSopBinding psb ON psb.processId = p.processId
      JOIN DetailSOP d ON d.sopId = psb.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.processCatalogSearchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findProcessWithBerlakuSop(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicProcessDbRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<Omit<PublicProcessDbRow, 'jumlahSopBerlaku'> & { jumlahSopBerlaku: bigint | number }>
    >`
      SELECT
        p.processId,
        p.nama,
        p.scope,
        p.departmentId,
        dep.nama AS departmentName,
        COUNT(DISTINCT d.detailSopId) AS jumlahSopBerlaku
      FROM Process p
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN ProcessSopBinding psb ON psb.processId = p.processId
      JOIN DetailSOP d ON d.sopId = psb.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.processCatalogSearchSql(params.search)}
      GROUP BY p.processId, p.nama, p.scope, p.departmentId, dep.nama
      ORDER BY
        CASE WHEN p.scope = ${OrganizationalScope.FACULTY} THEN 0 ELSE 1 END,
        dep.nama ASC,
        p.nama ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `;
    return rows.map((row) => ({
      ...row,
      jumlahSopBerlaku: Number(row.jumlahSopBerlaku),
    }));
  }

  async findProcessById(processId: string): Promise<PublicProcessDbRow | null> {
    const rows = await this.prisma.$queryRaw<
      Array<Omit<PublicProcessDbRow, 'jumlahSopBerlaku'> & { jumlahSopBerlaku: bigint | number }>
    >`
      SELECT
        p.processId,
        p.nama,
        p.scope,
        p.departmentId,
        dep.nama AS departmentName,
        COUNT(DISTINCT d.detailSopId) AS jumlahSopBerlaku
      FROM Process p
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      LEFT JOIN ProcessSopBinding psb ON psb.processId = p.processId
      LEFT JOIN DetailSOP d
        ON d.sopId = psb.sopId
        AND d.status = ${StatusSOP.BERLAKU}
      LEFT JOIN DokumenTte dt
        ON dt.detailSopId = d.detailSopId
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
      WHERE p.processId = ${processId}
      GROUP BY p.processId, p.nama, p.scope, p.departmentId, dep.nama
      LIMIT 1
    `;
    const row = rows[0];
    return row === undefined
      ? null
      : { ...row, jumlahSopBerlaku: Number(row.jumlahSopBerlaku) };
  }

  async countBerlakuSopByProcess(processId: string, search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT d.detailSopId) AS total
      FROM ProcessSopBinding psb
      JOIN SOP s ON s.sopId = psb.sopId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE psb.processId = ${processId}
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.searchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findBerlakuSopByProcess(params: {
    processId: string;
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicFtiSopDbRow[]> {
    return this.findPublishedProcessSopRows(
      Prisma.sql`psb.processId = ${params.processId}`,
      params.search,
      params.skip,
      params.take,
    );
  }

  async countFtiSopGlobal(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM (
        SELECT DISTINCT d.detailSopId
        FROM ProcessSopBinding psb
        JOIN Process p ON p.processId = psb.processId
        LEFT JOIN Department dep ON dep.departmentId = p.departmentId
        JOIN SOP s ON s.sopId = psb.sopId
        JOIN DetailSOP d ON d.sopId = s.sopId
        JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
        WHERE d.status = ${StatusSOP.BERLAKU}
          AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
          AND dt.pdfStatus = ${'PUBLISHED'}
          AND dt.pdfPath IS NOT NULL
          ${this.ftiSearchSql(search)}

        UNION ALL

        SELECT DISTINCT d.detailSopId
        FROM DetailSOP d
        JOIN SOP s ON s.sopId = d.sopId
        JOIN OPD o ON o.opdId = s.opdId
        JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
        WHERE o.deletedAt IS NULL
          AND d.status = ${StatusSOP.BERLAKU}
          AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
          AND dt.pdfStatus = ${'PUBLISHED'}
          AND dt.pdfPath IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ProcessSopBinding existingBinding WHERE existingBinding.sopId = s.sopId
          )
          ${this.searchSql(search, true)}
      ) catalog
    `;
    return this.toCount(rows);
  }

  async findFtiSopGlobal(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicFtiSopDbRow[]> {
    return this.prisma.$queryRaw<PublicFtiSopDbRow[]>`
      SELECT *
      FROM (
        SELECT DISTINCT
          d.detailSopId,
          d.sopId,
          s.opdId,
          s.judul,
          d.nomorSOP,
          d.versi,
          d.tanggalEfektif,
          o.nama AS opdNama,
          dt.pdfPath,
          p.processId,
          p.nama AS processName,
          p.scope,
          p.departmentId,
          dep.nama AS departmentName
        FROM ProcessSopBinding psb
        JOIN Process p ON p.processId = psb.processId
        LEFT JOIN Department dep ON dep.departmentId = p.departmentId
        JOIN SOP s ON s.sopId = psb.sopId
        JOIN OPD o ON o.opdId = s.opdId
        JOIN DetailSOP d ON d.sopId = s.sopId
        JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
        WHERE d.status = ${StatusSOP.BERLAKU}
          AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
          AND dt.pdfStatus = ${'PUBLISHED'}
          AND dt.pdfPath IS NOT NULL
          ${this.ftiSearchSql(params.search)}

        UNION ALL

        SELECT DISTINCT
          d.detailSopId,
          d.sopId,
          s.opdId,
          s.judul,
          d.nomorSOP,
          d.versi,
          d.tanggalEfektif,
          o.nama AS opdNama,
          dt.pdfPath,
          NULL AS processId,
          NULL AS processName,
          NULL AS scope,
          NULL AS departmentId,
          NULL AS departmentName
        FROM DetailSOP d
        JOIN SOP s ON s.sopId = d.sopId
        JOIN OPD o ON o.opdId = s.opdId
        JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
        WHERE o.deletedAt IS NULL
          AND d.status = ${StatusSOP.BERLAKU}
          AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
          AND dt.pdfStatus = ${'PUBLISHED'}
          AND dt.pdfPath IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ProcessSopBinding existingBinding WHERE existingBinding.sopId = s.sopId
          )
          ${this.searchSql(params.search, true)}
      ) catalog
      ORDER BY judul ASC, nomorSOP ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `;
  }

  async findPublishedPdfByDetailSopId(detailSopId: string): Promise<PublicSopPdfDbRow | null> {
    const rows = await this.prisma.$queryRaw<PublicSopPdfDbRow[]>`
      SELECT d.detailSopId, s.judul, d.nomorSOP, d.versi, dt.pdfPath, dt.pdfSha256
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      JOIN OPD o ON o.opdId = s.opdId
      LEFT JOIN ProcessSopBinding psb ON psb.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.detailSopId = ${detailSopId}
        AND (psb.sopId IS NOT NULL OR o.deletedAt IS NULL)
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async findPublishedSopRows(
    extraWhere: Prisma.Sql,
    search: string | undefined,
    skip: number,
    take: number,
    includeOpdInSearch = false,
  ): Promise<PublicSopDbRow[]> {
    return this.prisma.$queryRaw<PublicSopDbRow[]>`
      SELECT
        d.detailSopId,
        d.sopId,
        s.opdId,
        s.judul,
        d.nomorSOP,
        d.versi,
        d.tanggalEfektif,
        o.nama AS opdNama,
        dt.pdfPath
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      JOIN OPD o ON o.opdId = s.opdId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE ${extraWhere}
        AND o.deletedAt IS NULL
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.searchSql(search, includeOpdInSearch)}
      ORDER BY s.judul ASC
      LIMIT ${take} OFFSET ${skip}
    `;
  }

  private async findPublishedProcessSopRows(
    extraWhere: Prisma.Sql,
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<PublicFtiSopDbRow[]> {
    return this.prisma.$queryRaw<PublicFtiSopDbRow[]>`
      SELECT DISTINCT
        d.detailSopId,
        d.sopId,
        s.opdId,
        s.judul,
        d.nomorSOP,
        d.versi,
        d.tanggalEfektif,
        o.nama AS opdNama,
        dt.pdfPath,
        p.processId,
        p.nama AS processName,
        p.scope,
        p.departmentId,
        dep.nama AS departmentName
      FROM ProcessSopBinding psb
      JOIN Process p ON p.processId = psb.processId
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN SOP s ON s.sopId = psb.sopId
      JOIN OPD o ON o.opdId = s.opdId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE ${extraWhere}
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.searchSql(search)}
      ORDER BY s.judul ASC
      LIMIT ${take} OFFSET ${skip}
    `;
  }

  private searchSql(search?: string, includeOpd = false): Prisma.Sql {
    if (search === undefined) {
      return Prisma.empty;
    }
    const like = `%${search}%`;
    return includeOpd
      ? Prisma.sql`AND (d.nomorSOP LIKE ${like} OR s.judul LIKE ${like} OR o.nama LIKE ${like})`
      : Prisma.sql`AND (d.nomorSOP LIKE ${like} OR s.judul LIKE ${like})`;
  }

  private processCatalogSearchSql(search?: string): Prisma.Sql {
    if (search === undefined) {
      return Prisma.empty;
    }
    const like = `%${search}%`;
    return Prisma.sql`AND (p.nama LIKE ${like} OR dep.nama LIKE ${like})`;
  }

  private ftiSearchSql(search?: string): Prisma.Sql {
    if (search === undefined) {
      return Prisma.empty;
    }
    const like = `%${search}%`;
    return Prisma.sql`AND (
      d.nomorSOP LIKE ${like}
      OR s.judul LIKE ${like}
      OR p.nama LIKE ${like}
      OR dep.nama LIKE ${like}
    )`;
  }

  private toCount(rows: Array<{ total: bigint | number }>): number {
    return Number(rows[0]?.total ?? 0);
  }
}
