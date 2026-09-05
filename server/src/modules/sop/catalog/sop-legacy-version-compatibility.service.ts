import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PeranPengguna } from '../../../generated/prisma';
import {
  hasRevisiInFlight,
  TERMINAL_DETAIL_STATUSES,
} from '../../../common/status/sop-editable.util';
import { displayStatusSop } from '../../../common/status/status-display';
import type { PenyusunWorkbenchDataDto } from './dto/penyusun-workbench-data.dto';
import type { SopRiwayatVersiRowDto } from './dto/sop-riwayat-versi-row.dto';
import { assertSopCatalogRepoOk } from './sop-catalog-repo-error.util';
import { mapWorkbenchPayload } from './sop-catalog.mapper';
import { SopCatalogRepository } from './sop-catalog.repository';
import { SopLegacyAccessPolicy } from './sop-legacy-access.policy';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';

@Injectable()
export class SopLegacyVersionCompatibilityService {
  constructor(
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly sopLegacyAccessPolicy: SopLegacyAccessPolicy,
  ) {}

  async createVersion(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimitRaw?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    if (user.peran !== PeranPengguna.PENYUSUN && user.peran !== PeranPengguna.PJ_PENYUSUN) {
      throw new ForbiddenException('Hanya Penyusun atau PJ Penyusun yang dapat melakukan aksi ini');
    }

    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    const source = await this.sopCatalogRepository.findLatestDetailStatusContext(
      resolved.detailSopId,
    );
    if (source === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    await this.sopLegacyAccessPolicy.assertLegacyContextAccess(user, source);

    try {
      const cloned = assertSopCatalogRepoOk(
        await this.sopCatalogRepository.cloneDetailSopFromSource({
          sourceDetailSopId: source.detailSopId,
          penggunaId: user.sub,
        }),
      );
      const logsLimit = this.clampLogsLimit(logsLimitRaw);
      const workbench = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
        cloned.detailSopId,
        logsLimit,
      );
      if (workbench === null) {
        throw new NotFoundException('DetailSOP tidak ditemukan setelah membuat versi baru');
      }
      return mapWorkbenchPayload(workbench);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          'Versi baru lain telah dibuat secara bersamaan. Muat ulang riwayat versi.',
        );
      }
      throw error;
    }
  }

  async getVersionHistory(user: JwtAccessPayload, sopId: string): Promise<SopRiwayatVersiRowDto[]> {
    const header = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(sopId);
    const resolvedSopId = header?.sopId ?? sopId;
    const firstDetail =
      await this.sopCatalogRepository.findLatestDetailStatusContext(resolvedSopId);
    if (firstDetail === null) {
      throw new NotFoundException('SOP tidak ditemukan');
    }
    await this.sopLegacyAccessPolicy.assertLegacyContextAccess(user, firstDetail);
    const rows = await this.sopCatalogRepository.findRiwayatVersiBySopId(resolvedSopId);
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

  private clampLogsLimit(raw: number | undefined): number {
    if (raw === undefined || Number.isNaN(raw)) return 100;
    const value = Math.floor(raw);
    if (value < 1) return 1;
    return Math.min(value, 500);
  }
}
