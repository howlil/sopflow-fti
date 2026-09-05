import { Injectable, NotFoundException } from '@nestjs/common';
import type { PenyusunWorkbenchDataDto } from './dto/penyusun-workbench-data.dto';
import { mapWorkbenchPayload } from './sop-catalog.mapper';
import { SopCatalogRepository } from './sop-catalog.repository';

/**
 * Compatibility-neutral workbench projection shared by native Process paths.
 * Authorization is deliberately owned by the caller's workflow boundary.
 */
@Injectable()
export class SopWorkbenchReader {
  constructor(private readonly sopCatalogRepository: SopCatalogRepository) {}

  async getForDetail(
    detailSopId: string,
    logsLimitRaw?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const logsLimit = this.clampLogsLimit(logsLimitRaw);
    const row = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
      detailSopId,
      logsLimit,
    );
    if (row === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    return mapWorkbenchPayload(row);
  }

  private clampLogsLimit(raw: number | undefined): number {
    if (raw === undefined || Number.isNaN(raw)) return 100;
    const value = Math.floor(raw);
    if (value < 1) return 1;
    return Math.min(value, 500);
  }
}
