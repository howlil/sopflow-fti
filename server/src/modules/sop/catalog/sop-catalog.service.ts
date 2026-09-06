import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusSOP } from '../../../generated/prisma';
import type { PublicSopDokumenDto } from '../public/dto/public-sop-dokumen.dto';
import { mapWorkbenchPayload } from './sop-catalog.mapper';
import { SopCatalogRepository } from './sop-catalog.repository';

/** Read-only projection retained for official Process-bound public document preview. */
@Injectable()
export class SopCatalogService {
  constructor(private readonly sopCatalogRepository: SopCatalogRepository) {}

  async getPublicDokumenBerlaku(detailSopId: string): Promise<PublicSopDokumenDto> {
    const row = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(detailSopId, 0);
    if (row === null || row.status !== StatusSOP.BERLAKU || row.sop.processId === null) {
      throw new NotFoundException('Dokumen SOP FTI berlaku tidak ditemukan');
    }

    const workbench = mapWorkbenchPayload(row);
    return {
      detail: workbench.detail,
      langkah: workbench.langkah,
      diagramKonfigurasi: workbench.diagramKonfigurasi,
    };
  }
}
