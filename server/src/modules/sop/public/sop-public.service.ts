import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { resolvePagination, toPaginatedData, type PaginatedData } from '../../../common/utils/pagination.util';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import { SopPdfStorageService } from '../pdf/sop-pdf-storage.service';
import type { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import type { PublicProcessItemDto } from './dto/public-process-item.dto';
import type { PublicSopByProcessPageDto } from './dto/public-sop-by-process-page.dto';
import type { PublicSopDokumenDto } from './dto/public-sop-dokumen.dto';
import type { PublicSopItemDto } from './dto/public-sop-item.dto';
import { SopPublicRepository, type PublicFtiSopDbRow, type PublicProcessDbRow } from './sop-public.repository';

@Injectable()
export class SopPublicService {
  constructor(
    private readonly sopPublicRepository: SopPublicRepository,
    private readonly sopCatalogService: SopCatalogService,
    private readonly sopPdfStorageService: SopPdfStorageService,
  ) {}

  async listProcess(query: PublicArsipQueryDto): Promise<PaginatedData<PublicProcessItemDto>> {
    const { page, limit, skip, take } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.sopPublicRepository.countProcessWithBerlakuSop(query.search),
      this.sopPublicRepository.findProcessWithBerlakuSop({ search: query.search, skip, take }),
    ]);
    return toPaginatedData(rows.map((row) => this.mapProcessItem(row)), total, page, limit);
  }

  async listSopByProcess(
    processId: string,
    query: PublicArsipQueryDto,
  ): Promise<PublicSopByProcessPageDto> {
    const process = await this.sopPublicRepository.findProcessById(processId);
    if (process === null) throw new NotFoundException('Process tidak ditemukan');

    const { page, limit, skip, take } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.sopPublicRepository.countBerlakuSopByProcess(processId, query.search),
      this.sopPublicRepository.findBerlakuSopByProcess({ processId, search: query.search, skip, take }),
    ]);
    return {
      ...toPaginatedData(rows.map((row) => this.mapSopItem(row)), total, page, limit),
      process: this.mapProcessItem(process),
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

  private mapProcessItem(row: PublicProcessDbRow): PublicProcessItemDto {
    return {
      processId: row.processId,
      nama: row.nama,
      scope: row.scope,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
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
      processId: row.processId,
      processName: row.processName,
      scope: row.scope,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
      pdfUrl: `/sop/public/pdf/${encodeURIComponent(row.detailSopId)}`,
    };
  }

  private sanitizeFilename(value: string): string {
    return value.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
  }
}
