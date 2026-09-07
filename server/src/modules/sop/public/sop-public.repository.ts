import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JenisDokumenTte, LingkupOrganisasi, Prisma, StatusSOP } from '../../../generated/prisma';

export type PublicProsesBisnisDbRow = {
  readonly prosesBisnisId: string;
  readonly nama: string;
  readonly lingkup: LingkupOrganisasi;
  readonly departemenId: string | null;
  readonly namaDepartemen: string | null;
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
  readonly prosesBisnisId: string;
  readonly namaProsesBisnis: string;
  readonly lingkup: LingkupOrganisasi;
  readonly departemenId: string | null;
  readonly namaDepartemen: string | null;
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

  async countProsesBisnisWithBerlakuSop(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT p.prosesBisnisId) AS total
      FROM ProsesBisnis p
      LEFT JOIN Departemen dep ON dep.departemenId = p.departemenId
      JOIN SOP s ON s.prosesBisnisId = p.prosesBisnisId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.EFFECTIVE}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.processCatalogSearchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findProsesBisnisWithBerlakuSop(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicProsesBisnisDbRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<Omit<PublicProsesBisnisDbRow, 'jumlahSopBerlaku'> & { jumlahSopBerlaku: bigint | number }>
    >`
      SELECT
        p.prosesBisnisId,
        p.nama,
        p.lingkup,
        p.departemenId,
        dep.nama AS namaDepartemen,
        COUNT(DISTINCT d.detailSopId) AS jumlahSopBerlaku
      FROM ProsesBisnis p
      LEFT JOIN Departemen dep ON dep.departemenId = p.departemenId
      JOIN SOP s ON s.prosesBisnisId = p.prosesBisnisId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.EFFECTIVE}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.processCatalogSearchSql(params.search)}
      GROUP BY p.prosesBisnisId, p.nama, p.lingkup, p.departemenId, dep.nama
      ORDER BY
        CASE WHEN p.lingkup = ${LingkupOrganisasi.FACULTY} THEN 0 ELSE 1 END,
        dep.nama ASC,
        p.nama ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `;
    return rows.map((row) => ({ ...row, jumlahSopBerlaku: Number(row.jumlahSopBerlaku) }));
  }

  async findProsesBisnisById(prosesBisnisId: string): Promise<PublicProsesBisnisDbRow | null> {
    const rows = await this.prisma.$queryRaw<
      Array<Omit<PublicProsesBisnisDbRow, 'jumlahSopBerlaku'> & { jumlahSopBerlaku: bigint | number }>
    >`
      SELECT
        p.prosesBisnisId,
        p.nama,
        p.lingkup,
        p.departemenId,
        dep.nama AS namaDepartemen,
        COUNT(DISTINCT d.detailSopId) AS jumlahSopBerlaku
      FROM ProsesBisnis p
      LEFT JOIN Departemen dep ON dep.departemenId = p.departemenId
      LEFT JOIN SOP s ON s.prosesBisnisId = p.prosesBisnisId
      LEFT JOIN DetailSOP d ON d.sopId = s.sopId AND d.status = ${StatusSOP.EFFECTIVE}
      LEFT JOIN DokumenTte dt
        ON dt.detailSopId = d.detailSopId
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
      WHERE p.prosesBisnisId = ${prosesBisnisId}
      GROUP BY p.prosesBisnisId, p.nama, p.lingkup, p.departemenId, dep.nama
      LIMIT 1
    `;
    const row = rows[0];
    return row === undefined ? null : { ...row, jumlahSopBerlaku: Number(row.jumlahSopBerlaku) };
  }

  async countBerlakuSopByProsesBisnis(prosesBisnisId: string, search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT d.detailSopId) AS total
      FROM SOP s
      JOIN ProsesBisnis p ON p.prosesBisnisId = s.prosesBisnisId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE p.prosesBisnisId = ${prosesBisnisId}
        AND d.status = ${StatusSOP.EFFECTIVE}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
        ${this.sopSearchSql(search)}
    `;
    return this.toCount(rows);
  }

  async findBerlakuSopByProsesBisnis(params: {
    prosesBisnisId: string;
    search?: string;
    skip: number;
    take: number;
  }): Promise<PublicFtiSopDbRow[]> {
    return this.findPublishedProsesBisnisSopRows(
      Prisma.sql`p.prosesBisnisId = ${params.prosesBisnisId}`,
      params.search,
      params.skip,
      params.take,
    );
  }

  async countFtiSopGlobal(search?: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(DISTINCT d.detailSopId) AS total
      FROM SOP s
      JOIN ProsesBisnis p ON p.prosesBisnisId = s.prosesBisnisId
      LEFT JOIN Departemen dep ON dep.departemenId = p.departemenId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.status = ${StatusSOP.EFFECTIVE}
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
    return this.findPublishedProsesBisnisSopRows(
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
      JOIN ProsesBisnis p ON p.prosesBisnisId = s.prosesBisnisId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE d.detailSopId = ${detailSopId}
        AND d.status = ${StatusSOP.EFFECTIVE}
        AND dt.jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
        AND dt.pdfStatus = ${'PUBLISHED'}
        AND dt.pdfPath IS NOT NULL
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async findPublishedProsesBisnisSopRows(
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
        p.prosesBisnisId,
        p.nama AS namaProsesBisnis,
        p.lingkup,
        p.departemenId,
        dep.nama AS namaDepartemen
      FROM SOP s
      JOIN ProsesBisnis p ON p.prosesBisnisId = s.prosesBisnisId
      LEFT JOIN Departemen dep ON dep.departemenId = p.departemenId
      JOIN DetailSOP d ON d.sopId = s.sopId
      JOIN DokumenTte dt ON dt.detailSopId = d.detailSopId
      WHERE ${extraWhere}
        AND d.status = ${StatusSOP.EFFECTIVE}
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
