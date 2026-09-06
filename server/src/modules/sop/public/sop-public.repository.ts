import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JenisDokumenTte, OrganizationalScope, Prisma, StatusSOP } from '../../../generated/prisma';

export type PublicProcessDbRow = {
  readonly processId: string;
  readonly nama: string;
  readonly scope: OrganizationalScope;
  readonly departmentId: string | null;
  readonly departmentName: string | null;
  readonly jumlahSopBerlaku: number;
};

export type PublicFtiSopDbRow = {
  readonly detailSopId: string;
  readonly sopId: string;
  readonly judul: string;
  readonly nomorSOP: string;
  readonly versi: number;
  readonly tanggalEfektif: Date | null;
  readonly pdfPath: string;
  readonly processId: string;
  readonly processName: string;
  readonly scope: OrganizationalScope;
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

  async countProcessWithBerlakuSop(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT p.processId) AS total
      FROM Process p
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN SOP s ON s.processId = p.processId
      JOIN DetailSOP d ON d.sopId = s.sopId
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
      JOIN SOP s ON s.processId = p.processId
      JOIN DetailSOP d ON d.sopId = s.sopId
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
    return rows.map((row) => ({ ...row, jumlahSopBerlaku: Number(row.jumlahSopBerlaku) }));
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
      LEFT JOIN SOP s ON s.processId = p.processId
      LEFT JOIN DetailSOP d ON d.sopId = s.sopId AND d.status = ${StatusSOP.BERLAKU}
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
    return row === undefined ? null : { ...row, jumlahSopBerlaku: Number(row.jumlahSopBerlaku) };
  }

  async countBerlakuSopByProcess(processId: string, search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT d.detailSopId) AS total
      FROM SOP s
      JOIN Process p ON p.processId = s.processId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE p.processId = ${processId}
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.sopSearchSql(search)}
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
      Prisma.sql`p.processId = ${params.processId}`,
      params.search,
      params.skip,
      params.take,
    );
  }

  async countFtiSopGlobal(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT d.detailSopId) AS total
      FROM SOP s
      JOIN Process p ON p.processId = s.processId
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.ftiSearchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findFtiSopGlobal(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicFtiSopDbRow[]> {
    return this.findPublishedProcessSopRows(
      Prisma.sql`1 = 1`,
      params.search,
      params.skip,
      params.take,
    );
  }

  async findPublishedPdfByDetailSopId(detailSopId: string): Promise<PublicSopPdfDbRow | null> {
    const rows = await this.prisma.$queryRaw<PublicSopPdfDbRow[]>`
      SELECT d.detailSopId, s.judul, d.nomorSOP, d.versi, dt.pdfPath, dt.pdfSha256
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      JOIN Process p ON p.processId = s.processId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.detailSopId = ${detailSopId}
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
      LIMIT 1
    `;
    return rows[0] ?? null;
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
        s.judul,
        d.nomorSOP,
        d.versi,
        d.tanggalEfektif,
        dt.pdfPath,
        p.processId,
        p.nama AS processName,
        p.scope,
        p.departmentId,
        dep.nama AS departmentName
      FROM SOP s
      JOIN Process p ON p.processId = s.processId
      LEFT JOIN Department dep ON dep.departmentId = p.departmentId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE ${extraWhere}
        AND d.status = ${StatusSOP.BERLAKU}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.ftiSearchSql(search)}
      ORDER BY s.judul ASC, d.nomorSOP ASC
      LIMIT ${take} OFFSET ${skip}
    `;
  }

  private sopSearchSql(search?: string): Prisma.Sql {
    if (search === undefined) return Prisma.empty;
    const like = `%${search}%`;
    return Prisma.sql`AND (d.nomorSOP LIKE ${like} OR s.judul LIKE ${like})`;
  }

  private processCatalogSearchSql(search?: string): Prisma.Sql {
    if (search === undefined) return Prisma.empty;
    const like = `%${search}%`;
    return Prisma.sql`AND (p.nama LIKE ${like} OR dep.nama LIKE ${like})`;
  }

  private ftiSearchSql(search?: string): Prisma.Sql {
    if (search === undefined) return Prisma.empty;
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
