import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { resolvePagination, toPaginatedData, type PaginatedData } from '../../../common/utils/pagination.util';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import { SopPdfStorageService } from '../pdf/sop-pdf-storage.service';
import type { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import type { PublicProsesBisnisItemDto } from './dto/public-process-item.dto';
import type { PublicSopByProsesBisnisPageDto } from './dto/public-sop-by-process-page.dto';
import type { PublicSopDokumenDto } from './dto/public-sop-dokumen.dto';
import type { PublicSopItemDto } from './dto/public-sop-item.dto';
import { SopPublicRepository, type PublicFtiSopDbRow, type PublicProsesBisnisDbRow } from './sop-public.repository';

@Injectable()
export class SopPublicService {
  constructor(
    private readonly sopPublicRepository: SopPublicRepository,
    private readonly sopCatalogService: SopCatalogService,
    private readonly sopPdfStorageService: SopPdfStorageService,
  ) {}

  async listProsesBisnis(query: PublicArsipQueryDto): Promise<PaginatedData<PublicProsesBisnisItemDto>> {
    const { page, limit, skip, take } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.sopPublicRepository.countProsesBisnisWithBerlakuSop(query.search),
      this.sopPublicRepository.findProsesBisnisWithBerlakuSop({ search: query.search, skip, take }),
    ]);
    return toPaginatedData(rows.map((row) => this.mapProsesBisnisItem(row)), total, page, limit);
  }

  async listSopByProsesBisnis(
    prosesBisnisId: string,
    query: PublicArsipQueryDto,
  ): Promise<PublicSopByProsesBisnisPageDto> {
    const process = await this.sopPublicRepository.findProsesBisnisById(prosesBisnisId);
    if (process === null) throw new NotFoundException('Proses Bisnis tidak ditemukan');

    const { page, limit, skip, take } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.sopPublicRepository.countBerlakuSopByProsesBisnis(prosesBisnisId, query.search),
      this.sopPublicRepository.findBerlakuSopByProsesBisnis({ prosesBisnisId, search: query.search, skip, take }),
    ]);
    return {
      ...toPaginatedData(rows.map((row) => this.mapSopItem(row)), total, page, limit),
      process: this.mapProsesBisnisItem(process),
    };
  }

  async listFtiSopGlobal(query: PublicArsipQueryDto): Promise<PaginatedData<PublicSopItemDto>> {
    const { page, limit, skip, take } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.sopPublicRepository.countFtiSopGlobal(query.search),
      this.sopPublicRepository.findFtiSopGlobal({ search: query.search, skip, take }),
    ]);
    return toPaginatedData(rows.map((row) => this.mapSopItem(row)), total, page, limit);
  }

  async getDokumen(detailSopId: string): Promise<PublicSopDokumenDto> {
    return this.sopCatalogService.getPublicDokumenBerlaku(detailSopId);
  }

  async getPublishedPdf(detailSopId: string): Promise<{
    buffer: Buffer;
    filename: string;
    sizeBytes: number;
  }> {
    const row = await this.sopPublicRepository.findPublishedPdfByDetailSopId(detailSopId);
    if (row === null) {
      throw new GoneException('SOP sudah dicabut, digantikan, atau belum memiliki PDF resmi');
    }
    try {
      const file = await this.sopPdfStorageService.readPublishedPdf(row.pdfPath);
      return {
        buffer: file.buffer,
        sizeBytes: file.sizeBytes,
        filename: this.sanitizeFilename(`SOP-${row.nomorSOP}-v${row.versi}.pdf`),
      };
    } catch {
      throw new GoneException('File PDF SOP resmi tidak tersedia');
    }
  }

  private mapProsesBisnisItem(row: PublicProsesBisnisDbRow): PublicProsesBisnisItemDto {
    return {
      prosesBisnisId: row.prosesBisnisId,
      nama: row.nama,
      scope: row.scope,
      departemenId: row.departemenId,
      namaDepartemen: row.namaDepartemen,
      jumlahSopBerlaku: row.jumlahSopBerlaku,
    };
  }

  private mapSopItem(row: PublicFtiSopDbRow): PublicSopItemDto {
    return {
      detailSopId: row.detailSopId,
      sopId: row.sopId,
      judul: row.judul,
      nomorSOP: row.nomorSOP,
      versi: row.versi,
      tanggalEfektif: row.tanggalEfektif === null ? null : row.tanggalEfektif.toISOString(),
      prosesBisnisId: row.prosesBisnisId,
      namaProsesBisnis: row.namaProsesBisnis,
      scope: row.scope,
      departemenId: row.departemenId,
      namaDepartemen: row.namaDepartemen,
      pdfUrl: `/sop/public/pdf/${encodeURIComponent(row.detailSopId)}`,
    };
  }

  private sanitizeFilename(value: string): string {
    return value.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
  }
}
