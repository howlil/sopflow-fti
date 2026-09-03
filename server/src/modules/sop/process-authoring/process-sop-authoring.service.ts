import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { extractDbInvariantMessage } from '../../../common/prisma/prisma-db-invariant.util';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import { PeranPengguna, StatusSOP } from '../../../generated/prisma';
import { ProcessContextService } from '../../core/process/process-context.service';
import type { ListSopQueryDto } from '../catalog/dto/list-sop-query.dto';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import type { SopDaftarRowDto } from '../catalog/dto/sop-daftar-row.dto';
import type { UpdateSopHeaderDto } from '../catalog/dto/update-sop-header.dto';
import { mapDaftarRow } from '../catalog/sop-catalog.mapper';
import {
  SopCatalogRepository,
  type SopDaftarListFilters,
  type UpdateSopHeaderRepoInput,
} from '../catalog/sop-catalog.repository';
import { assertSopCatalogRepoOk } from '../catalog/sop-catalog-repo-error.util';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import type { CreateProcessSopDto } from './dto/create-process-sop.dto';

type ProcessAwareSopRow = SopDaftarRowDto & {
  processId: string | null;
  processNama: string | null;
};

@Injectable()
export class ProcessSopAuthoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processContextService: ProcessContextService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly sopCatalogService: SopCatalogService,
  ) {}

  async listForCurrentUser(
    user: JwtAccessPayload,
    query?: ListSopQueryDto,
  ): Promise<ProcessAwareSopRow[]> {
    const filters = this.normalizeFilters(query);
    const [myProcesses, allNativeSops, allRows] = await Promise.all([
      this.processContextService.listForUser(user.sub),
      this.prisma.sOP.findMany({ select: { sopId: true, processId: true } }),
      this.sopCatalogRepository.findDaftarAll(filters),
    ]);

    const processById = new Map(myProcesses.map((process) => [process.processId, process]));
    const processBySop = new Map(
      allNativeSops
        .filter((sop): sop is typeof sop & { processId: string } => sop.processId !== null)
        .map((sop) => [sop.sopId, sop.processId]),
    );
    const accessibleTargetSopIds = new Set(
      allNativeSops
        .filter((sop) => sop.processId !== null && processById.has(sop.processId))
        .map((sop) => sop.sopId),
    );

    const additionalTargetRows: ProcessAwareSopRow[] = allRows
      .filter((row) => accessibleTargetSopIds.has(row.sopId))
      .map((row) => {
        const processId = processBySop.get(row.sopId);
        const process = processId === undefined ? undefined : processById.get(processId);
        return {
          ...mapDaftarRow(row),
          processId: process?.processId ?? null,
          processNama: process?.nama ?? null,
        };
      });

    return additionalTargetRows.sort((a, b) => {
      const aTime = a.terakhirDiperbarui ?? '';
      const bTime = b.terakhirDiperbarui ?? '';
      return bTime.localeCompare(aTime);
    });
  }

  async create(user: JwtAccessPayload, dto: CreateProcessSopDto): Promise<ProcessAwareSopRow> {
    const process = await this.processContextService.assertCanAuthor(user.sub, dto.processId);

    const namaLembaga = dto.namaLembaga?.trim() ?? '';
    let sopId: string;
    try {
      sopId = await this.prisma.$transaction(async (tx) => {
        const sop = await tx.sOP.create({
          data: {
            judul: dto.judul.trim(),
            processId: process.processId,
          },
          select: { sopId: true },
        });
        await tx.detailSOP.create({
          data: {
            sopId: sop.sopId,
            nomorSOP: dto.nomorSop.trim(),
            versi: 1,
            status: StatusSOP.DRAFT,
            dibuatOlehId: user.sub,
            namaLembaga,
          },
        });
        return sop.sopId;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Nomor SOP sudah digunakan');
      }
      throw error;
    }

    const row = (await this.sopCatalogRepository.findDaftarAll()).find((item) => item.sopId === sopId);
    if (row === undefined) {
      throw new NotFoundException('SOP tidak ditemukan setelah dibuat');
    }
    return {
      ...mapDaftarRow(row),
      processId: process.processId,
      processNama: process.nama,
    };
  }

  async getWorkbench(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveProcessContext(detailOrSopId);
    if (context.processId === null) {
      this.assertLegacyAuthoringRole(user);
      return this.sopCatalogService.getPenyusunWorkbench(user, detailOrSopId, logsLimit);
    }
    const process = await this.processContextService.assertCanAuthor(
      user.sub,
      context.processId,
    );
    const workbench = await this.sopCatalogService.getPenyusunWorkbenchForEvaluasiContext(
      context.resolved.detailSopId,
      logsLimit,
    );
    return this.withProcessContext(workbench, process.processId, process.nama);
  }

  async updateHeader(
    user: JwtAccessPayload,
    detailOrSopId: string,
    dto: UpdateSopHeaderDto,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveProcessContext(detailOrSopId);
    if (context.processId === null) {
      this.assertLegacyAuthoringRole(user);
      return this.sopCatalogService.updatePenyusunHeader(user, detailOrSopId, dto, logsLimit);
    }
    const process = await this.processContextService.assertCanAuthor(
      user.sub,
      context.processId,
    );
    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.resolved.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    assertDetailSopEditable(statusContext.status);

    const changedFields = this.collectChangedHeaderFields(dto);
    if (changedFields.length > 0) {
      try {
        assertSopCatalogRepoOk(
          await this.sopCatalogRepository.updateSopHeaderTransaction({
            detailSopId: context.resolved.detailSopId,
            sopId: context.resolved.sopId,
            userId: user.sub,
            input: this.toRepoInput(dto),
            changedFields,
          }),
        );
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          throw new ConflictException('Nomor SOP sudah digunakan');
        }
        const invariant = extractDbInvariantMessage(error);
        if (invariant) {
          throw new BadRequestException(invariant);
        }
        throw error;
      }
    }

    const refreshed = await this.sopCatalogService.getPenyusunWorkbenchForEvaluasiContext(
      context.resolved.detailSopId,
      logsLimit,
    );
    return this.withProcessContext(refreshed, process.processId, process.nama);
  }

  async deleteVersionDraft(user: JwtAccessPayload, detailSopId: string): Promise<void> {
    const context = await this.resolveProcessContext(detailSopId);
    if (context.processId === null) {
      await this.sopCatalogService.hapusVersiDraft(user, detailSopId);
      return;
    }
    await this.processContextService.assertCanAuthor(user.sub, context.processId);
    assertSopCatalogRepoOk(await this.sopCatalogRepository.deleteVersiDraft(context.resolved.detailSopId));
  }

  async deleteInitialDraft(user: JwtAccessPayload, detailSopId: string): Promise<void> {
    const context = await this.resolveProcessContext(detailSopId);
    if (context.processId === null) {
      await this.sopCatalogService.hapusSopDraftAwal(user, detailSopId);
      return;
    }
    await this.processContextService.assertCanAuthor(user.sub, context.processId);
    assertSopCatalogRepoOk(
      await this.sopCatalogRepository.deleteSopDraftAwal(context.resolved.detailSopId),
    );
  }

  private async resolveProcessContext(detailOrSopId: string) {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });
    return { resolved, processId: sop?.processId ?? null };
  }

  private isLegacyAuthoringRole(user: JwtAccessPayload): boolean {
    return user.peran === PeranPengguna.PENYUSUN || user.peran === PeranPengguna.PJ_PENYUSUN;
  }

  private assertLegacyAuthoringRole(user: JwtAccessPayload): void {
    if (!this.isLegacyAuthoringRole(user)) {
      throw new ForbiddenException(
        'SOP legacy hanya dapat diakses dari authoring oleh Penyusun atau PJ Penyusun',
      );
    }
  }

  private withProcessContext(
    workbench: PenyusunWorkbenchDataDto,
    processId: string,
    processNama: string,
  ): PenyusunWorkbenchDataDto {
    return {
      ...workbench,
      detail: {
        ...workbench.detail,
        sop: workbench.detail.sop
          ? ({ ...workbench.detail.sop, processId, processNama } as typeof workbench.detail.sop)
          : workbench.detail.sop,
      },
    };
  }

  private normalizeFilters(query?: ListSopQueryDto): SopDaftarListFilters {
    const status = query?.status && query.status !== 'all' ? query.status : undefined;
    const tanggalDari = query?.tanggalDari?.trim() || undefined;
    const tanggalSampai = query?.tanggalSampai?.trim() || undefined;
    if (tanggalDari !== undefined && tanggalSampai !== undefined && tanggalDari > tanggalSampai) {
      throw new BadRequestException('tanggalDari tidak boleh lebih besar dari tanggalSampai');
    }
    return { status, tanggalDari, tanggalSampai };
  }

  private collectChangedHeaderFields(dto: UpdateSopHeaderDto): string[] {
    const fields: string[] = [];
    if (dto.judul !== undefined) fields.push('judul');
    if (dto.nomorSOP !== undefined) fields.push('nomorSOP');
    if (dto.namaLembaga !== undefined) fields.push('namaLembaga');
    if (dto.dasarHukumPeraturanIds !== undefined) fields.push('dasarHukumPeraturanIds');
    if (dto.sopTerkaitDetailIds !== undefined) fields.push('sopTerkaitDetailIds');
    if (dto.lampiran?.peringatan !== undefined) fields.push('peringatan');
    if (dto.lampiran?.kualifikasiPelaksanaan !== undefined) fields.push('kualifikasiPelaksanaan');
    if (dto.lampiran?.peralatanPerlengkapan !== undefined) fields.push('peralatanPerlengkapan');
    if (dto.lampiran?.pencatatanPendataan !== undefined) fields.push('pencatatanPendataan');
    return fields;
  }

  private toRepoInput(dto: UpdateSopHeaderDto): UpdateSopHeaderRepoInput {
    return {
      judul: dto.judul,
      nomorSOP: dto.nomorSOP,
      namaLembaga: dto.namaLembaga,
      dasarHukumPeraturanIds: dto.dasarHukumPeraturanIds,
      sopTerkaitDetailIds: dto.sopTerkaitDetailIds,
      lampiran: dto.lampiran,
    };
  }
}
