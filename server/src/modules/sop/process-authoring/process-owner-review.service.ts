import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import {
  BagianSOP,
  OrganizationalAuthority,
  ProcessNotificationKind,
  ProcessReviewDecision as ProcessReviewDecisionDb,
  StatusSOP,
} from '../../../generated/prisma';
import { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import { ProcessContextService } from '../../core/process/process-context.service';
import {
  ProcessNotificationService,
  type ProcessNotificationCreateInput,
} from '../../notifications/process/process-notification.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { assertSopWorkbenchCompleteForSiapDievaluasi } from '../catalog/sop-completeness.validator';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';
import { ProcessReviewDecision } from './dto/process-review-decision.dto';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@Injectable()
export class ProcessOwnerReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processContextService: ProcessContextService,
    private readonly organizationalAuthorityService: OrganizationalAuthorityService,
    private readonly processNotificationService: ProcessNotificationService,
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly processSopAuthoringService: ProcessSopAuthoringService,
  ) {}

  async submitForReview(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    const process = await this.processContextService.assertCanAuthor(user.sub, context.processId);

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
    assertSopWorkbenchCompleteForSiapDievaluasi(draftPayload);

    await this.transitionStatus({
      detailSopId: context.detailSopId,
      expectedStatus: statusContext.status,
      targetStatus: StatusSOP.PROCESS_REVIEW,
      userId: user.sub,
      notification: {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        processId: context.processId,
        penggunaId: process.ownerId,
        kind: ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED,
        processName: process.nama,
      },
    });

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId, logsLimit);
  }

  async review(
    user: JwtAccessPayload,
    detailOrSopId: string,
    decision: ProcessReviewDecision,
    catatanRaw?: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const catatan = catatanRaw?.trim() || null;
    const context = await this.resolveTargetContext(detailOrSopId);
    const process = await this.processContextService.assertCanReview(user.sub, context.processId);

    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (statusContext.status !== StatusSOP.PROCESS_REVIEW) {
      throw new ConflictException(
        `SOP belum berada pada Process Owner review (status saat ini: ${String(statusContext.status)})`,
      );
    }

    const targetStatus =
      decision === ProcessReviewDecision.REVISION
        ? StatusSOP.REVISION_REQUIRED
        : StatusSOP.FINAL_APPROVAL;

    let notification: ProcessNotificationCreateInput | undefined;
    if (decision === ProcessReviewDecision.REVISION) {
      const detail = await this.prisma.detailSOP.findUnique({
        where: { detailSopId: context.detailSopId },
        select: { dibuatOlehId: true },
      });
      if (detail === null) {
        throw new NotFoundException('DetailSOP tidak ditemukan');
      }
      if (detail.dibuatOlehId === null) {
        throw new ConflictException('Author SOP Process tidak tersedia untuk feedback revisi');
      }
      notification = {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        processId: context.processId,
        penggunaId: detail.dibuatOlehId,
        kind: ProcessNotificationKind.PROCESS_REVISION_REQUESTED,
        processName: process.nama,
        catatan: catatan ?? undefined,
      };
    } else {
      const authority = await this.organizationalAuthorityService.resolveForProcess(context.processId);
      notification = {
        detailSopId: context.detailSopId,
        sopId: context.sopId,
        processId: context.processId,
        penggunaId: authority.holderId,
        kind: ProcessNotificationKind.FINAL_APPROVAL_REQUESTED,
        processName: process.nama,
        authorityLabel:
          authority.authority === OrganizationalAuthority.DEAN ? 'Dekan' : 'Kepala Departemen',
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
        processId: context.processId,
        reviewedById: user.sub,
        decision:
          decision === ProcessReviewDecision.REVISION
            ? ProcessReviewDecisionDb.REVISION
            : ProcessReviewDecisionDb.ACCEPT,
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
    notification?: ProcessNotificationCreateInput;
    reviewEvidence?: {
      detailSopId: string;
      sopId: string;
      processId: string;
      reviewedById: string;
      decision: ProcessReviewDecisionDb;
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
        await this.processNotificationService.createInTransaction(tx, params.notification);
      }
      if (params.reviewEvidence !== undefined) {
        await tx.processReview.create({ data: params.reviewEvidence });
      }
    });

    if (params.notification !== undefined) {
      this.processNotificationService.emitChanged(params.notification.penggunaId);
    }
  }

  private async resolveTargetContext(detailOrSopId: string): Promise<{
    detailSopId: string;
    sopId: string;
    processId: string;
  }> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });
    if (sop?.processId === null || sop === null) {
      throw new ConflictException('SOP arsip tanpa Process tidak dapat masuk workflow FTI');
    }
    return {
      detailSopId: resolved.detailSopId,
      sopId: resolved.sopId,
      processId: sop.processId,
    };
  }
}
