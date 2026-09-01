import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import { BagianSOP, StatusSOP } from '../../../generated/prisma';
import { ProcessContextService } from '../../core/process/process-context.service';
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
    private readonly sopCatalogRepository: SopCatalogRepository,
    private readonly processSopAuthoringService: ProcessSopAuthoringService,
  ) {}

  async submitForReview(
    user: JwtAccessPayload,
    detailOrSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    await this.processContextService.assertCanAuthor(user.sub, context.processId);

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

    // Transitional persisted status. For Process-bound SOPs this means
    // "submitted / under Process Owner review", not centralized evaluator ownership.
    await this.transitionStatus({
      detailSopId: context.detailSopId,
      expectedStatus: statusContext.status,
      targetStatus: StatusSOP.SEDANG_DIEVALUASI,
      userId: user.sub,
    });

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId, logsLimit);
  }

  async review(
    user: JwtAccessPayload,
    detailOrSopId: string,
    decision: ProcessReviewDecision,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const context = await this.resolveTargetContext(detailOrSopId);
    await this.processContextService.assertCanReview(user.sub, context.processId);

    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (statusContext.status !== StatusSOP.SEDANG_DIEVALUASI) {
      throw new ConflictException(
        `SOP belum berada pada Process Owner review (status saat ini: ${String(statusContext.status)})`,
      );
    }

    const targetStatus =
      decision === ProcessReviewDecision.REVISION
        ? StatusSOP.REVISI_DARI_EVALUATOR
        : StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR;

    await this.transitionStatus({
      detailSopId: context.detailSopId,
      expectedStatus: StatusSOP.SEDANG_DIEVALUASI,
      targetStatus,
      userId: user.sub,
    });

    return this.processSopAuthoringService.getWorkbench(user, context.detailSopId, logsLimit);
  }

  private async transitionStatus(params: {
    detailSopId: string;
    expectedStatus: StatusSOP;
    targetStatus: StatusSOP;
    userId: string;
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
    });
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
    const binding = await this.prisma.processSopBinding.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });
    if (binding === null) {
      throw new ConflictException('SOP legacy belum terikat Process dan tetap memakai workflow kompatibilitas');
    }
    return {
      detailSopId: resolved.detailSopId,
      sopId: resolved.sopId,
      processId: binding.processId,
    };
  }
}
