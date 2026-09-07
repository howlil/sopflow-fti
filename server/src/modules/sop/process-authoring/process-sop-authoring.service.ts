import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { extractDbInvariantMessage } from '../../../common/prisma/prisma-db-invariant.util';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import { PejabatBerwenang, LingkupOrganisasi, StatusSOP } from '../../../generated/prisma';
import { ProsesBisnisContextService } from '../../core/process/konteks-proses-bisnis.service';
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
import { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import type { CreateProsesBisnisSopDto } from './dto/create-process-sop.dto';
import {
  projectProsesBisnisSopLifecycle,
  type ProsesBisnisSopLifecycleProjection,
} from './sop-proses-bisnis-lifecycle.projection';

type ProsesBisnisAwareSopRow = SopDaftarRowDto & {
  prosesBisnisId: string | null;
  processNama: string | null;
  lifecycle: ProsesBisnisSopLifecycleProjection;
};

type FinalApprovalReference = { detailSopId: string };
type AuthorityAssignmentReference = {
  authorityKey: string;
  authority: PejabatBerwenang;
  departemenId: string | null;
  holderId: string;
};

@Injectable()
export class ProsesBisnisSopAuthoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processContextService: ProsesBisnisContextService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly sopWorkbenchReader: SopWorkbenchReader,
  ) {}

  async listForCurrentUser(
    user: JwtAccessPayload,
    query?: ListSopQueryDto,
  ): Promise<ProsesBisnisAwareSopRow[]> {
    const filters = this.normalizeFilters(query);
    const [myProsesBisnises, allNativeSops, allRows] = await Promise.all([
      this.processContextService.listForUser(user.sub),
      this.prisma.sOP.findMany({ select: { sopId: true, prosesBisnisId: true } }),
      this.sopCatalogRepository.findDaftarAll(filters),
    ]);

    const processById = new Map(myProsesBisnises.map((process) => [process.prosesBisnisId, process]));
    const processBySop = new Map(
      allNativeSops
        .filter((sop): sop is typeof sop & { prosesBisnisId: string } => sop.prosesBisnisId !== null)
        .map((sop) => [sop.sopId, sop.prosesBisnisId]),
    );
    const accessibleTargetSopIds = new Set(
      allNativeSops
        .filter((sop) => sop.prosesBisnisId !== null && processById.has(sop.prosesBisnisId))
        .map((sop) => sop.sopId),
    );

    const accessibleRows = allRows
      .filter((row) => accessibleTargetSopIds.has(row.sopId))
      .map((row) => ({ row, prosesBisnisId: processBySop.get(row.sopId) }))
      .filter(
        (entry): entry is { row: (typeof allRows)[number]; prosesBisnisId: string } =>
          entry.prosesBisnisId !== undefined && processById.has(entry.prosesBisnisId),
      );

    if (accessibleRows.length === 0) return [];

    const detailIds = accessibleRows
      .map(({ row }) => row.detail?.detailSopId)
      .filter((detailId): detailId is string => detailId !== undefined);
    const authorityKeys = [
      ...new Set(
        accessibleRows.flatMap(({ prosesBisnisId }) => {
          const process = processById.get(prosesBisnisId);
          if (process === undefined) return [];
          return [
            process.scope === LingkupOrganisasi.FACULTY
              ? 'DEAN'
              : process.departemenId === null
                ? null
                : `HEAD_OF_DEPARTMENT:${process.departemenId}`,
          ].filter((key): key is string => key !== null);
        }),
      ),
    ];
    const [approvals, assignments]: [FinalApprovalReference[], AuthorityAssignmentReference[]] =
      await Promise.all([
        detailIds.length === 0
          ? []
          : this.prisma.processFinalApproval.findMany({
              where: { detailSopId: { in: detailIds } },
              select: { detailSopId: true },
            }),
        authorityKeys.length === 0
          ? []
          : this.prisma.organizationalAuthorityAssignment.findMany({
              where: { authorityKey: { in: authorityKeys } },
              select: { authorityKey: true, authority: true, departemenId: true, holderId: true },
            }),
      ]);
    const approvalIds = new Set(approvals.map((approval) => approval.detailSopId));
    const assignmentByKey = new Map<string, AuthorityAssignmentReference>(
      assignments.map((assignment): [string, AuthorityAssignmentReference] => [
        assignment.authorityKey,
        assignment,
      ]),
    );
    const holderIds = [...new Set(assignments.map((assignment) => assignment.holderId))];
    const holders =
      holderIds.length === 0
        ? []
        : await this.prisma.pengguna.findMany({
            where: { penggunaId: { in: holderIds }, deletedAt: null },
            select: { penggunaId: true, nama: true },
          });
    const holderById = new Map(holders.map((holder) => [holder.penggunaId, holder]));

    const additionalTargetRows: ProsesBisnisAwareSopRow[] = accessibleRows.map(({ row, prosesBisnisId }) => {
      const process = processById.get(prosesBisnisId);
      if (process === undefined) {
        throw new Error('Proses Bisnis disappeared while projecting Proses Bisnis SOP lifecycle');
      }
      const mapped = mapDaftarRow(row);
      const detailSopId = mapped.detailSopId ?? mapped.id;
      const authorityKey =
        process.scope === LingkupOrganisasi.FACULTY
          ? 'DEAN'
          : process.departemenId === null
            ? null
            : `HEAD_OF_DEPARTMENT:${process.departemenId}`;
      const assignment = authorityKey === null ? undefined : assignmentByKey.get(authorityKey);
      const expectedAuthority =
        process.scope === LingkupOrganisasi.FACULTY
          ? PejabatBerwenang.DEAN
          : PejabatBerwenang.HEAD_OF_DEPARTMENT;
      const isConsistentAuthority =
        assignment !== undefined &&
        assignment.authority === expectedAuthority &&
        assignment.departemenId === process.departemenId;
      const holder = assignment === undefined ? undefined : holderById.get(assignment.holderId);
      return {
        ...mapped,
        prosesBisnisId: process.prosesBisnisId,
        processNama: process.nama,
        lifecycle: projectProsesBisnisSopLifecycle({
          status: mapped.status,
          approvalExists: approvalIds.has(detailSopId),
          currentUserId: user.sub,
          detailSopId,
          process: {
            scope: process.scope,
            ownerId: process.ownerId,
            ownerName: process.owner?.nama ?? null,
            namaDepartemen: process.department?.nama ?? null,
          },
          authority: !isConsistentAuthority
            ? null
            : { holderId: assignment.holderId, holderName: holder?.nama ?? null },
        }),
      };
    });

    return additionalTargetRows.sort((a, b) => {
      const aTime = a.terakhirDiperbarui ?? '';
      const bTime = b.terakhirDiperbarui ?? '';
      return bTime.localeCompare(aTime);
    });
  }

  async create(user: JwtAccessPayload, dto: CreateProsesBisnisSopDto): Promise<ProsesBisnisAwareSopRow> {
    const process = await this.processContextService.assertCanAuthor(user.sub, dto.prosesBisnisId);

    const namaLembaga = dto.namaLembaga?.trim() ?? '';
    let sopId: string;
    try {
      sopId = await this.prisma.$transaction(async (tx) => {
        const sop = await tx.sOP.create({
          data: {
            judul: dto.judul.trim(),
            prosesBisnisId: process.prosesBisnisId,
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

    const row = (await this.sopCatalogRepository.findDaftarAll()).find(
      (item) => item.sopId === sopId,
    );
    if (row === undefined) {
      throw new NotFoundException('SOP tidak ditemukan setelah dibuat');
    }
    return {
      ...mapDaftarRow(row),
      prosesBisnisId: process.prosesBisnisId,
      processNama: process.nama,
      lifecycle: projectProsesBisnisSopLifecycle({
        status: row.detail?.status ?? StatusSOP.DRAFT,
        approvalExists: false,
        currentUserId: user.sub,
        detailSopId: row.detail?.detailSopId ?? row.sopId,
        process: {
          scope: process.scope,
          ownerId: process.ownerId,
          ownerName: process.owner?.nama ?? null,
          namaDepartemen: process.department?.nama ?? null,
        },
        authority: null,
      }),
    };
  }

  async getWorkbench(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveProsesBisnisContext(detailOrSopId);
    if (context.prosesBisnisId === null) {
      throw new ConflictException(
        'SOP belum memiliki Penanggung Jawab Proses Bisnisship dan tidak tersedia pada endpoint native',
      );
    }
    const process = await this.processContextService.assertCanAuthor(user.sub, context.prosesBisnisId);
    const workbench = await this.sopWorkbenchReader.getForDetail(
      context.resolved.detailSopId,
      logsLimit,
    );
    return this.withProsesBisnisContext(
      await this.withStatusProsesBisnis(user, workbench, process),
      process.prosesBisnisId,
      process.nama,
    );
  }

  async updateHeader(
    user: JwtAccessPayload,
    detailOrSopId: string,
    dto: UpdateSopHeaderDto,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveProsesBisnisContext(detailOrSopId);
    if (context.prosesBisnisId === null) {
      throw new ConflictException(
        'SOP belum memiliki Penanggung Jawab Proses Bisnisship dan tidak tersedia pada endpoint native',
      );
    }
    const process = await this.processContextService.assertCanAuthor(user.sub, context.prosesBisnisId);
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

    const refreshed = await this.sopWorkbenchReader.getForDetail(
      context.resolved.detailSopId,
      logsLimit,
    );
    return this.withProsesBisnisContext(
      await this.withStatusProsesBisnis(user, refreshed, process),
      process.prosesBisnisId,
      process.nama,
    );
  }

  async deleteVersionDraft(user: JwtAccessPayload, detailSopId: string): Promise<void> {
    const context = await this.resolveProsesBisnisContext(detailSopId);
    if (context.prosesBisnisId === null) {
      throw new ConflictException(
        'SOP belum memiliki Penanggung Jawab Proses Bisnisship dan tidak tersedia pada endpoint native',
      );
    }
    await this.processContextService.assertCanAuthor(user.sub, context.prosesBisnisId);
    assertSopCatalogRepoOk(
      await this.sopCatalogRepository.deleteVersiDraft(context.resolved.detailSopId),
    );
  }

  async deleteInitialDraft(user: JwtAccessPayload, detailSopId: string): Promise<void> {
    const context = await this.resolveProsesBisnisContext(detailSopId);
    if (context.prosesBisnisId === null) {
      throw new ConflictException(
        'SOP belum memiliki Penanggung Jawab Proses Bisnisship dan tidak tersedia pada endpoint native',
      );
    }
    await this.processContextService.assertCanAuthor(user.sub, context.prosesBisnisId);
    assertSopCatalogRepoOk(
      await this.sopCatalogRepository.deleteSopDraftAwal(context.resolved.detailSopId),
    );
  }

  private async resolveProsesBisnisContext(detailOrSopId: string) {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { prosesBisnisId: true },
    });
    return { resolved, prosesBisnisId: sop?.prosesBisnisId ?? null };
  }

  private withProsesBisnisContext(
    workbench: PenyusunWorkbenchDataDto,
    prosesBisnisId: string,
    processNama: string,
  ): PenyusunWorkbenchDataDto {
    return {
      ...workbench,
      detail: {
        ...workbench.detail,
        sop: workbench.detail.sop
          ? ({ ...workbench.detail.sop, prosesBisnisId, processNama } as typeof workbench.detail.sop)
          : workbench.detail.sop,
      },
    };
  }

  private async withStatusProsesBisnis(
    user: JwtAccessPayload,
    workbench: PenyusunWorkbenchDataDto,
    process: Awaited<ReturnType<ProsesBisnisContextService['assertCanAuthor']>>,
  ): Promise<PenyusunWorkbenchDataDto> {
    const detailSopId = workbench.detail.id;
    const approval = await this.prisma.processFinalApproval.findFirst({
      where: { detailSopId },
      select: { detailSopId: true },
    });

    const authorityKey =
      process.scope === LingkupOrganisasi.FACULTY
        ? 'DEAN'
        : process.departemenId === null
          ? null
          : `HEAD_OF_DEPARTMENT:${process.departemenId}`;
    let authority: { holderId: string; holderName: string | null } | null = null;
    if (authorityKey !== null) {
      const assignment = await this.prisma.organizationalAuthorityAssignment.findFirst({
        where: { authorityKey },
        select: { authority: true, departemenId: true, holderId: true },
      });
      const expectedAuthority =
        process.scope === LingkupOrganisasi.FACULTY
          ? PejabatBerwenang.DEAN
          : PejabatBerwenang.HEAD_OF_DEPARTMENT;
      if (
        assignment !== null &&
        assignment.authority === expectedAuthority &&
        assignment.departemenId === process.departemenId
      ) {
        const holder = await this.prisma.pengguna.findFirst({
          where: { penggunaId: assignment.holderId, deletedAt: null },
          select: { nama: true },
        });
        if (holder !== null) {
          authority = { holderId: assignment.holderId, holderName: holder.nama };
        }
      }
    }

    return {
      ...workbench,
      lifecycle: projectProsesBisnisSopLifecycle({
        status: workbench.detail.status,
        approvalExists: approval !== null,
        currentUserId: user.sub,
        detailSopId,
        process: {
          scope: process.scope,
          ownerId: process.ownerId,
          ownerName: process.owner?.nama ?? null,
          namaDepartemen: process.department?.nama ?? null,
        },
        authority,
      }),
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
