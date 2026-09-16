import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  PejabatBerwenang,
  JenisNotifikasiProsesBisnis,
  KeputusanPemeriksaanProsesBisnis as KeputusanPemeriksaanProsesBisnisDb,
  Prisma,
  StatusPaketPemeriksaanProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import { displayStatusSop } from '../../../common/status/status-display';
import { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import {
  NotifikasiProsesBisnisService,
  type NotifikasiProsesBisnisCreateInput,
} from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { mapWorkbenchPayload } from '../catalog/sop-catalog.mapper';
import { pastikanWorkbenchSopLengkapUntukPemeriksaanProsesBisnis } from '../catalog/sop-completeness.validator';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { KeputusanPemeriksaanProsesBisnis } from './dto/pemeriksaan-proses-bisnis-decision.dto';
import { ProsesBisnisSopAuthoringService } from './sop-proses-bisnis-authoring.service';

@Injectable()
export class ProsesBisnisOwnerReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly konteksProsesBisnisService: ProsesBisnisContextService,
    private readonly organizationalAuthorityService: PejabatBerwenangService,
    private readonly notifikasiProsesBisnisService: NotifikasiProsesBisnisService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly processSopAuthoringService: ProsesBisnisSopAuthoringService,
  ) {}

  async submitForReview(
    user: JwtAccessPayload,
    detailOrSopId: string,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    await this.submitBatchForReview(user, [context.detailSopId]);

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId);
  }

  async submitBatchForReview(user: JwtAccessPayload, detailSopIds: string[]) {
    const uniqueDetailSopIds = [...new Set(detailSopIds)];
    if (uniqueDetailSopIds.length === 0) {
      throw new BadRequestException('Pilih sekurang-kurangnya satu SOP untuk diajukan');
    }
    if (uniqueDetailSopIds.length > 20) {
      throw new BadRequestException('Satu Paket Pemeriksaan maksimal berisi 20 SOP');
    }

    const details = await this.prisma.detailSOP.findMany({
      where: { detailSopId: { in: uniqueDetailSopIds } },
      select: {
        detailSopId: true,
        sopId: true,
        status: true,
        versi: true,
        sop: { select: { prosesBisnisId: true, judul: true } },
      },
    });
    const detailById = new Map(details.map((detail) => [detail.detailSopId, detail]));
    const missingIds = uniqueDetailSopIds.filter((id) => !detailById.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException({
        message: 'Sebagian SOP yang dipilih tidak ditemukan',
        errors: missingIds.map((detailSopId) => ({ detailSopId, reason: 'NOT_FOUND' })),
      });
    }

    const selected = uniqueDetailSopIds.flatMap((detailSopId) => {
      const detail = detailById.get(detailSopId);
      return detail === undefined ? [] : [detail];
    });
    const processIds = new Set(selected.map((detail) => detail.sop.prosesBisnisId));
    if (processIds.size !== 1) {
      throw new BadRequestException(
        'Satu Paket Pemeriksaan hanya boleh berisi SOP dalam Proses Bisnis yang sama',
      );
    }
    const prosesBisnisId = selected[0].sop.prosesBisnisId;
    const prosesBisnis = await this.konteksProsesBisnisService.assertCanAuthor(
      user.sub,
      prosesBisnisId,
    );

    const latestDetails = await this.prisma.detailSOP.findMany({
      where: { sopId: { in: selected.map((detail) => detail.sopId) } },
      orderBy: [{ sopId: 'asc' }, { versi: 'desc' }],
      select: { detailSopId: true, sopId: true },
    });
    const latestBySopId = new Map<string, string>();
    for (const detail of latestDetails) {
      if (!latestBySopId.has(detail.sopId)) latestBySopId.set(detail.sopId, detail.detailSopId);
    }

    const preflightErrors: Array<{ detailSopId: string; reason: string }> = [];
    for (const detail of selected) {
      if (latestBySopId.get(detail.sopId) !== detail.detailSopId) {
        preflightErrors.push({ detailSopId: detail.detailSopId, reason: 'NOT_LATEST_VERSION' });
        continue;
      }
      if (detail.status !== StatusSOP.DRAFT && detail.status !== StatusSOP.REVISION_REQUIRED) {
        preflightErrors.push({
          detailSopId: detail.detailSopId,
          reason: `INVALID_STATUS:${detail.status}`,
        });
        continue;
      }
      const workbench = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
        detail.detailSopId,
      );
      if (workbench === null) {
        preflightErrors.push({ detailSopId: detail.detailSopId, reason: 'NOT_FOUND' });
        continue;
      }
      try {
        pastikanWorkbenchSopLengkapUntukPemeriksaanProsesBisnis(workbench);
      } catch (error) {
        preflightErrors.push({
          detailSopId: detail.detailSopId,
          reason: error instanceof Error ? error.message : 'INCOMPLETE_SOP',
        });
      }
    }
    if (preflightErrors.length > 0) {
      throw new BadRequestException({
        message: 'Paket tidak diajukan karena terdapat SOP yang belum memenuhi persyaratan',
        errors: preflightErrors,
      });
    }

    const paket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paketPemeriksaanProsesBisnis.create({
        data: {
          prosesBisnisId,
          diajukanOlehId: user.sub,
          penanggungJawabId: prosesBisnis.penanggungJawabId,
          status: StatusPaketPemeriksaanProsesBisnis.IN_REVIEW,
        },
      });
      await tx.paketPemeriksaanProsesBisnisItem.createMany({
        data: uniqueDetailSopIds.map((detailSopId) => ({
          paketPemeriksaanProsesBisnisId: created.paketPemeriksaanProsesBisnisId,
          detailSopId,
        })),
      });
      const transitioned = await tx.detailSOP.updateMany({
        where: {
          detailSopId: { in: uniqueDetailSopIds },
          status: { in: [StatusSOP.DRAFT, StatusSOP.REVISION_REQUIRED] },
        },
        data: { status: StatusSOP.PROCESS_REVIEW, terakhirDieditOlehId: user.sub },
      });
      if (transitioned.count !== uniqueDetailSopIds.length) {
        throw new ConflictException(
          'Status salah satu SOP berubah saat paket diproses. Muat ulang lalu ulangi pengajuan.',
        );
      }
      for (const detail of selected) {
        await this.notifikasiProsesBisnisService.createInTransaction(tx, {
          detailSopId: detail.detailSopId,
          sopId: detail.sopId,
          prosesBisnisId,
          penggunaId: prosesBisnis.penanggungJawabId,
          kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
          namaProsesBisnis: prosesBisnis.nama,
        });
      }
      return created;
    });

    this.notifikasiProsesBisnisService.emitChanged(prosesBisnis.penanggungJawabId);
    return {
      paketPemeriksaanProsesBisnisId: paket.paketPemeriksaanProsesBisnisId,
      prosesBisnisId,
      namaProsesBisnis: prosesBisnis.nama,
      penanggungJawabId: prosesBisnis.penanggungJawabId,
      status: paket.status,
      totalSop: uniqueDetailSopIds.length,
      menungguPemeriksaan: uniqueDetailSopIds.length,
      selesaiDiperiksa: 0,
      diajukanPada: paket.diajukanPada,
      items: selected.map((detail) => ({
        detailSopId: detail.detailSopId,
        sopId: detail.sopId,
        judul: detail.sop.judul,
        versi: detail.versi,
        status: StatusSOP.PROCESS_REVIEW,
      })),
    };
  }

  async listForCurrentReviewer(user: JwtAccessPayload) {
    const packages = await this.prisma.paketPemeriksaanProsesBisnis.findMany({
      where: { prosesBisnis: { penanggungJawabId: user.sub } },
      orderBy: { diajukanPada: 'desc' },
      include: {
        prosesBisnis: { select: { prosesBisnisId: true, nama: true } },
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            detailSop: {
              select: {
                detailSopId: true,
                sopId: true,
                versi: true,
                nomorSOP: true,
                status: true,
                updatedAt: true,
                sop: { select: { judul: true } },
                pemeriksaanProsesBisnis: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { catatan: true, decision: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    });
    return packages.map((paket) => {
      const items = paket.items.map((item) => {
        const detail = item.detailSop;
        const latestReview = detail.pemeriksaanProsesBisnis[0] ?? null;
        return {
          detailSopId: detail.detailSopId,
          sopId: detail.sopId,
          judul: detail.sop.judul,
          nomorSOP: detail.nomorSOP,
          versi: detail.versi,
          status: detail.status,
          statusLabel: displayStatusSop(detail.status).label,
          updatedAt: detail.updatedAt,
          catatanTerakhir: latestReview?.catatan ?? null,
        };
      });
      const menungguPemeriksaan = items.filter((item) => item.status === StatusSOP.PROCESS_REVIEW).length;
      const disetujui = items.filter((item) => item.status === StatusSOP.TTE_PENDING).length;
      const perluPerbaikan = items.filter((item) => item.status === StatusSOP.REVISION_REQUIRED).length;
      return {
        paketPemeriksaanProsesBisnisId: paket.paketPemeriksaanProsesBisnisId,
        prosesBisnisId: paket.prosesBisnisId,
        namaProsesBisnis: paket.prosesBisnis.nama,
        penanggungJawabId: paket.penanggungJawabId,
        status: paket.status,
        diajukanPada: paket.diajukanPada,
        selesaiPada: paket.selesaiPada,
        totalSop: items.length,
        menungguPemeriksaan,
        disetujui,
        perluPerbaikan,
        items,
      };
    });
  }

  async getReviewDocument(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    await this.konteksProsesBisnisService.assertCanReview(user.sub, context.prosesBisnisId);
    return this.readOnlyWorkbench(context.detailSopId, logsLimit);
  }

  async review(
    user: JwtAccessPayload,
    detailOrSopId: string,
    decision: KeputusanPemeriksaanProsesBisnis,
    catatanRaw?: string,
  ): Promise<PenyusunWorkbenchDataDto> {
    const catatan = catatanRaw?.trim() || null;
    const context = await this.resolveTargetContext(detailOrSopId);
    const prosesBisnis = await this.konteksProsesBisnisService.assertCanReview(user.sub, context.prosesBisnisId);

    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (statusContext.status !== StatusSOP.PROCESS_REVIEW) {
      throw new ConflictException(
        `SOP belum berada pada tahap Pemeriksaan Proses Bisnis (status saat ini: ${String(statusContext.status)})`,
      );
    }

    const targetStatus =
      decision === KeputusanPemeriksaanProsesBisnis.REVISION
        ? StatusSOP.REVISION_REQUIRED
        : StatusSOP.TTE_PENDING;

    let notification: NotifikasiProsesBisnisCreateInput | undefined;
    if (decision === KeputusanPemeriksaanProsesBisnis.REVISION) {
      const detail = await this.prisma.detailSOP.findUnique({
        where: { detailSopId: context.detailSopId },
        select: { dibuatOlehId: true },
      });
      if (detail === null) {
        throw new NotFoundException('DetailSOP tidak ditemukan');
      }
      if (detail.dibuatOlehId === null) {
        throw new ConflictException('Penyusun SOP tidak tersedia untuk menerima catatan revisi');
      }
      notification = {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        prosesBisnisId: context.prosesBisnisId,
        penggunaId: detail.dibuatOlehId,
        kind: JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED,
        namaProsesBisnis: prosesBisnis.nama,
        catatan: catatan ?? undefined,
      };
    } else {
      const authority = await this.organizationalAuthorityService.resolveForProsesBisnis(context.prosesBisnisId);
      notification = {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        prosesBisnisId: context.prosesBisnisId,
        penggunaId: authority.holderId,
        kind: JenisNotifikasiProsesBisnis.TTE_REQUESTED,
        namaProsesBisnis: prosesBisnis.nama,
        authorityLabel:
          authority.authority === PejabatBerwenang.DEAN ? 'Dekan' : 'Kepala Departemen',
      };
    }

    await this.transitionStatus({
      detailSopId: context.detailSopId,
      expectedStatus: StatusSOP.PROCESS_REVIEW,
      targetStatus,
      userId: user.sub,
      notification,
      reviewEvidence: {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        prosesBisnisId: context.prosesBisnisId,
        reviewedById: user.sub,
        decision:
          decision === KeputusanPemeriksaanProsesBisnis.REVISION
            ? KeputusanPemeriksaanProsesBisnisDb.REVISION
            : KeputusanPemeriksaanProsesBisnisDb.ACCEPT,
        previousStatus: statusContext.status,
        nextStatus: targetStatus,
        catatan,
      },
    });

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId);
  }

  private async transitionStatus(params: {
    detailSopId: string;
    expectedStatus: StatusSOP;
    targetStatus: StatusSOP;
    userId: string;
    notification?: NotifikasiProsesBisnisCreateInput;
    reviewEvidence?: {
      detailSopId: string;
      sopId: string;
      prosesBisnisId: string;
      reviewedById: string;
      decision: KeputusanPemeriksaanProsesBisnisDb;
      previousStatus: StatusSOP;
      nextStatus: StatusSOP;
      catatan?: string | null;
    };
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.detailSOP.updateMany({
        where: {
          detailSopId: params.detailSopId,
          status: params.expectedStatus,
        },
        data: {
          status: params.targetStatus,
          terakhirDieditOlehId: params.userId,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Status SOP berubah saat aksi diproses. Muat ulang dokumen lalu ulangi keputusan.',
        );
      }
      if (params.notification !== undefined) {
        await this.notifikasiProsesBisnisService.createInTransaction(tx, params.notification);
      }
      if (params.reviewEvidence !== undefined) {
        await tx.pemeriksaanProsesBisnis.create({ data: params.reviewEvidence });
        await this.refreshPaketStatusInTransaction(tx, params.detailSopId);
      }
    });

    if (params.notification !== undefined) {
      this.notifikasiProsesBisnisService.emitChanged(params.notification.penggunaId);
    }
  }

  private async refreshPaketStatusInTransaction(
    tx: Prisma.TransactionClient,
    detailSopId: string,
  ): Promise<void> {
    const items = await tx.paketPemeriksaanProsesBisnisItem.findMany({
      where: { detailSopId },
      select: { paketPemeriksaanProsesBisnisId: true },
    });
    for (const item of items) {
      const paket = await tx.paketPemeriksaanProsesBisnis.findUnique({
        where: { paketPemeriksaanProsesBisnisId: item.paketPemeriksaanProsesBisnisId },
        select: { items: { select: { detailSop: { select: { status: true } } } } },
      });
      if (paket === null) continue;
      const total = paket.items.length;
      const menunggu = paket.items.filter(
        (paketItem) => paketItem.detailSop.status === StatusSOP.PROCESS_REVIEW,
      ).length;
      const status =
        menunggu === 0
          ? StatusPaketPemeriksaanProsesBisnis.COMPLETED
          : menunggu === total
            ? StatusPaketPemeriksaanProsesBisnis.IN_REVIEW
            : StatusPaketPemeriksaanProsesBisnis.PARTIALLY_COMPLETED;
      await tx.paketPemeriksaanProsesBisnis.update({
        where: { paketPemeriksaanProsesBisnisId: item.paketPemeriksaanProsesBisnisId },
        data: { status, selesaiPada: menunggu === 0 ? new Date() : null },
      });
    }
  }

  private async resolveTargetContext(detailOrSopId: string): Promise<{
    detailSopId: string;
    sopId: string;
    prosesBisnisId: string;
  }> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    return {
      detailSopId: resolved.detailSopId,
      sopId: resolved.sopId,
      prosesBisnisId: resolved.prosesBisnisId,
    };
  }
}
