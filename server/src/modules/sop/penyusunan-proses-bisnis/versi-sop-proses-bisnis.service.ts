import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TERMINAL_DETAIL_STATUSES, hasRevisiInFlight } from '../lifecycle/sop-editable.util';
import { displayStatusSop } from '../lifecycle/status-display';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import type { SopRiwayatVersiRowDto } from '../catalog/dto/sop-riwayat-versi-row.dto';
import { assertSopCatalogRepoOk } from '../catalog/sop-catalog-repo-error.util';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';

@Injectable()
export class ProsesBisnisVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly konteksProsesBisnisService: ProsesBisnisContextService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly sopWorkbenchReader: SopWorkbenchReader,
  ) {}

  async createVersion(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) throw new NotFoundException('DetailSOP tidak ditemukan');

    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { prosesBisnisId: true },
    });
    if (sop?.prosesBisnisId == null) {
      throw new ConflictException('SOP tanpa Proses Bisnis hanya tersedia sebagai riwayat compatibility');
    }

    const prosesBisnis = await this.konteksProsesBisnisService.assertCanAuthor(user.sub, sop.prosesBisnisId);
    const source = await this.sopCatalogRepository.findLatestDetailStatusContext(resolved.detailSopId);
    if (source === null) throw new NotFoundException('DetailSOP tidak ditemukan');

    try {
      const cloned = assertSopCatalogRepoOk(
        await this.sopCatalogRepository.cloneDetailSopFromSource({
          sourceDetailSopId: source.detailSopId,
          penggunaId: user.sub,
        }),
      );
      const workbench = await this.sopWorkbenchReader.getForDetail(cloned.detailSopId, logsLimit);
      return {
        ...workbench,
        detail: {
          ...workbench.detail,
          sop: workbench.detail.sop
            ? ({ ...workbench.detail.sop, prosesBisnisId: prosesBisnis.prosesBisnisId, namaProsesBisnis: prosesBisnis.nama } as typeof workbench.detail.sop)
            : workbench.detail.sop,
        },
      };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Versi baru lain telah dibuat secara bersamaan. Muat ulang riwayat versi.');
      }
      throw error;
    }
  }

  async getVersionHistory(user: JwtAccessPayload, sopId: string): Promise<SopRiwayatVersiRowDto[]> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(sopId);
    if (resolved === null) throw new NotFoundException('SOP tidak ditemukan');
    if (resolved.prosesBisnisId === null) {
      throw new ConflictException('Riwayat SOP tanpa Proses Bisnis hanya tersedia sebagai compatibility history');
    }

    await this.konteksProsesBisnisService.assertCanAuthor(user.sub, resolved.prosesBisnisId);
    const rows = await this.sopCatalogRepository.findRiwayatVersiBySopId(resolved.sopId);
    const hasActiveRevision = hasRevisiInFlight(rows.map((row) => row.status));
    return rows.map((row) => {
      const statusDisplay = displayStatusSop(row.status);
      return {
        detailSopId: row.detailSopId,
        versi: row.versi,
        nomorSOP: row.nomorSOP,
        status: statusDisplay.value,
        statusLabel: statusDisplay.label,
        revisiDariDetailSopId: row.revisiDariDetailSopId,
        revisiDariVersi: row.revisiDariVersi,
        updatedAt: row.updatedAt.toISOString(),
        canHapusDraft: row.canHapusDraft,
        canBuatVersiBaru: !hasActiveRevision && TERMINAL_DETAIL_STATUSES.has(row.status),
      };
    });
  }
}
