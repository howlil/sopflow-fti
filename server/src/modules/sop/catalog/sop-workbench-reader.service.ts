import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  OrganizationalScope,
} from '../../../generated/prisma';
import type { PenyusunWorkbenchDataDto } from './dto/penyusun-workbench-data.dto';
import { mapWorkbenchPayload } from './sop-catalog.mapper';
import { SopCatalogRepository } from './sop-catalog.repository';

/**
 * Compatibility-neutral workbench projection shared by native Process paths.
 * Authorization remains owned by the caller; this reader enriches document
 * metadata with the current contextual signing authority only.
 */
@Injectable()
export class SopWorkbenchReader {
  constructor(
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly prisma: PrismaService,
  ) {}

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

    const mapped = mapWorkbenchPayload(row);
    if (row.sop.processId === null) return mapped;

    const process = await this.prisma.process.findUnique({
      where: { processId: row.sop.processId },
      select: { scope: true, departmentId: true },
    });
    if (process === null) return mapped;

    const expectedAuthority =
      process.scope === OrganizationalScope.FACULTY
        ? OrganizationalAuthority.DEAN
        : OrganizationalAuthority.HEAD_OF_DEPARTMENT;
    const authorityKey =
      process.scope === OrganizationalScope.FACULTY
        ? 'DEAN'
        : process.departmentId === null
          ? null
          : `HEAD_OF_DEPARTMENT:${process.departmentId}`;
    if (authorityKey === null) return mapped;

    const assignment = await this.prisma.organizationalAuthorityAssignment.findUnique({
      where: { authorityKey },
      select: { authority: true, departmentId: true, holderId: true },
    });
    if (
      assignment === null ||
      assignment.authority !== expectedAuthority ||
      assignment.departmentId !== process.departmentId
    ) {
      return mapped;
    }

    const holder = await this.prisma.pengguna.findFirst({
      where: { penggunaId: assignment.holderId, deletedAt: null },
      select: { nama: true, nip: true, jabatan: true },
    });
    if (holder === null) return mapped;

    return {
      ...mapped,
      detail: {
        ...mapped.detail,
        signingAuthority: {
          authority: assignment.authority,
          nama: holder.nama,
          nip: holder.nip,
          jabatan: holder.jabatan,
        },
      },
    };
  }

  private clampLogsLimit(raw: number | undefined): number {
    if (raw === undefined || Number.isNaN(raw)) return 100;
    const value = Math.floor(raw);
    if (value < 1) return 1;
    return Math.min(value, 500);
  }
}
