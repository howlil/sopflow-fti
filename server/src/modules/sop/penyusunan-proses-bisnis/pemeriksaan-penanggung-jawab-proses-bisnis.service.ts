import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import {
  BagianSOP,
  PejabatBerwenang,
  JenisNotifikasiProsesBisnis,
  KeputusanPemeriksaanProsesBisnis as KeputusanPemeriksaanProsesBisnisDb,
  StatusSOP,
} from '../../../generated/prisma';
import { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import {
  NotifikasiProsesBisnisService,
  type NotifikasiProsesBisnisCreateInput,
} from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { pastikanWorkbenchSopLengkapUntukPemeriksaanProsesBisnis } from '../catalog/sop-completeness.validator';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';
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
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    const prosesBisnis = await this.konteksProsesBisnisService.assertCanAuthor(user.sub, context.prosesBisnisId);

    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    assertDetailSopEditable(statusContext.status);

    const draftPayload = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
      context.detailSopId,
      logsLimit ?? 100,
    );
    if (draftPayload === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    pastikanWorkbenchSopLengkapUntukPemeriksaanProsesBisnis(draftPayload);

    await this.transitionStatus({
      detailSopId: context.detailSopId,
      expectedStatus: statusContext.status,
      targetStatus: StatusSOP.PROCESS_REVIEW,
      userId: user.sub,
      notification: {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        prosesBisnisId: context.prosesBisnisId,
        penggunaId: prosesBisnis.penanggungJawabId,
        kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
        namaProsesBisnis: prosesBisnis.nama,
      },
    });

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId, logsLimit);
  }

  async review(
    user: JwtAccessPayload,
    detailOrSopId: string,
    decision: KeputusanPemeriksaanProsesBisnis,
    catatanRaw?: string,
    logsLimit?: number,
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
        `SOP belum berada pada ProsesBisnis Owner review (status saat ini: ${String(statusContext.status)})`,
      );
    }

    const targetStatus =
      decision === KeputusanPemeriksaanProsesBisnis.REVISION
        ? StatusSOP.REVISION_REQUIRED
        : StatusSOP.FINAL_APPROVAL;

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
        throw new ConflictException('Author SOP Proses Bisnis tidak tersedia untuk feedback revisi');
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
        kind: JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED,
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

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId, logsLimit);
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
      await appendOrCreateLogSession({
        tx,
        detailSopId: params.detailSopId,
        penggunaId: params.userId,
        bagian: BagianSOP.STATUS,
        fields: ['status'],
        discrete: true,
      });
      if (params.notification !== undefined) {
        await this.notifikasiProsesBisnisService.createInTransaction(tx, params.notification);
      }
      if (params.reviewEvidence !== undefined) {
        await tx.pemeriksaanProsesBisnis.create({ data: params.reviewEvidence });
      }
    });

    if (params.notification !== undefined) {
      this.notifikasiProsesBisnisService.emitChanged(params.notification.penggunaId);
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
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { prosesBisnisId: true },
    });
    if (sop?.prosesBisnisId === null || sop === null) {
      throw new ConflictException('SOP arsip tanpa Proses Bisnis tidak dapat masuk workflow FTI');
    }
    return {
      detailSopId: resolved.detailSopId,
      sopId: resolved.sopId,
      prosesBisnisId: sop.prosesBisnisId,
    };
  }
}
