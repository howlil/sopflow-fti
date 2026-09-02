import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessContextService } from '../../core/process/process-context.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { assertSopCatalogRepoOk } from '../catalog/sop-catalog-repo-error.util';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { SopCatalogService } from '../catalog/sop-catalog.service';

@Injectable()
export class ProcessVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processContextService: ProcessContextService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly sopCatalogService: SopCatalogService,
  ) {}

  async createVersion(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }

    const binding = await this.prisma.processSopBinding.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });

    // Compatibility path remains owned by the legacy catalog service.
    if (binding === null) {
      return this.sopCatalogService.buatVersiBaruDariSumber(user, detailOrSopId, logsLimit);
    }

    const process = await this.processContextService.assertCanAuthor(user.sub, binding.processId);
    const source = await this.sopCatalogRepository.findLatestDetailStatusContext(
      resolved.detailSopId,
    );
    if (source === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }

    try {
      const cloned = assertSopCatalogRepoOk(
        await this.sopCatalogRepository.cloneDetailSopFromSource({
          sourceDetailSopId: source.detailSopId,
          penggunaId: user.sub,
        }),
      );
      const workbench = await this.sopCatalogService.getPenyusunWorkbenchForEvaluasiContext(
        cloned.detailSopId,
        logsLimit,
      );
      return {
        ...workbench,
        detail: {
          ...workbench.detail,
          sop: workbench.detail.sop
            ? ({
                ...workbench.detail.sop,
                processId: process.processId,
                processNama: process.nama,
              } as typeof workbench.detail.sop)
            : workbench.detail.sop,
        },
      };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Versi baru lain telah dibuat secara bersamaan. Muat ulang riwayat versi.',
        );
      }
      throw error;
    }
  }
}
