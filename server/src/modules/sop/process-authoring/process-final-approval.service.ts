import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  ProcessReviewDecision,
  StatusSOP,
} from '../../../generated/prisma';
import { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import { mapWorkbenchPayload } from '../catalog/sop-catalog.mapper';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';

@Injectable()
export class ProcessFinalApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: OrganizationalAuthorityService,
    private readonly sopCatalogRepository: SopCatalogRepository,
  ) {}

  async listForCurrentApprover(user: JwtAccessPayload) {
    const assignments = await this.authorityService.listMine(user.sub);
    if (assignments.length === 0) return [];

    const isDean = assignments.some(
      (assignment) => assignment.authority === OrganizationalAuthority.DEAN,
    );
    const departmentIds = assignments
      .filter(
        (assignment) =>
          assignment.authority === OrganizationalAuthority.HEAD_OF_DEPARTMENT &&
          assignment.departmentId !== null,
      )
      .map((assignment) => assignment.departmentId as string);
    if (!isDean && departmentIds.length === 0) return [];

    const processes = await this.prisma.process.findMany({
      where: {
        OR: [
          ...(isDean ? [{ scope: OrganizationalScope.FACULTY }] : []),
          ...(departmentIds.length > 0
            ? [{ scope: OrganizationalScope.DEPARTMENT, departmentId: { in: departmentIds } }]
            : []),
        ],
      },
      select: {
        processId: true,
        nama: true,
        scope: true,
        departmentId: true,
        department: { select: { nama: true } },
      },
    });
    if (processes.length === 0) return [];

    const processById = new Map(processes.map((process) => [process.processId, process]));
    const nativeSops = await this.prisma.sOP.findMany({
      where: { processId: { in: processes.map((process) => process.processId) } },
      select: { sopId: true, processId: true },
    });
    if (nativeSops.length === 0) return [];

    const processBySopId = new Map(
      nativeSops
        .filter((sop): sop is typeof sop & { processId: string } => sop.processId !== null)
        .map((sop) => [sop.sopId, sop.processId]),
    );
    const details = await this.prisma.detailSOP.findMany({
      where: { sopId: { in: nativeSops.map((sop) => sop.sopId) } },
      select: {
        detailSopId: true,
        sopId: true,
        nomorSOP: true,
        status: true,
        versi: true,
        updatedAt: true,
        sop: { select: { judul: true } },
      },
      orderBy: [{ sopId: 'asc' }, { versi: 'desc' }],
    });

    const latestBySopId = new Map<string, (typeof details)[number]>();
    for (const detail of details) {
      if (!latestBySopId.has(detail.sopId)) latestBySopId.set(detail.sopId, detail);
    }
    const readyLatest = [...latestBySopId.values()].filter(
      (detail) => detail.status === StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
    );
    const approvals =
      readyLatest.length === 0
        ? []
        : await this.prisma.processFinalApproval.findMany({
            where: { detailSopId: { in: readyLatest.map((detail) => detail.detailSopId) } },
          });
    const approvalByDetail = new Map(approvals.map((approval) => [approval.detailSopId, approval]));

    return readyLatest.map((detail) => {
      const processId = processBySopId.get(detail.sopId);
      if (!processId)
        throw new Error('Process SOP ownership disappeared while listing approval queue');
      const process = processById.get(processId);
      if (!process) throw new Error('Process disappeared while listing approval queue');
      const approval = approvalByDetail.get(detail.detailSopId) ?? null;
      return {
        detailSopId: detail.detailSopId,
        sopId: detail.sopId,
        judul: detail.sop.judul,
        nomorSOP: detail.nomorSOP,
        versi: detail.versi,
        processId: process.processId,
        processNama: process.nama,
        scope: process.scope,
        departmentId: process.departmentId,
        departmentNama: process.department?.nama ?? null,
        approval,
        updatedAt: detail.updatedAt,
      };
    });
  }

  async getContext(user: JwtAccessPayload, detailOrSopId: string) {
    const context = await this.resolveTargetContext(detailOrSopId);
    const resolved = await this.authorityService.resolveForProcess(context.processId);
    const approval = await this.prisma.processFinalApproval.findUnique({
      where: { detailSopId: context.detailSopId },
    });
    return {
      detailSopId: context.detailSopId,
      processId: context.processId,
      authority: resolved.authority,
      authorityKey: resolved.authorityKey,
      holderId: resolved.holderId,
      holderName: resolved.holderName,
      holderNip: resolved.holderNip,
      holderJabatan: resolved.holderJabatan,
      canApprove: resolved.holderId === user.sub,
      approval,
    };
  }

  async getDocumentForCurrentApprover(user: JwtAccessPayload, detailOrSopId: string) {
    const context = await this.resolveTargetContext(detailOrSopId);
    const authority = await this.authorityService.assertCanApprove(user.sub, context.processId);
    const row = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
      context.detailSopId,
      0,
    );
    if (row === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (row.status !== StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR) {
      throw new ConflictException(
        `SOP tidak berada pada tahap final approval/TTE (status saat ini: ${String(row.status)})`,
      );
    }
    return {
      workbench: mapWorkbenchPayload(row),
      authority: {
        authority: authority.authority,
        authorityKey: authority.authorityKey,
        holderId: authority.holderId,
        holderName: authority.holderName,
        holderNip: authority.holderNip,
        holderJabatan: authority.holderJabatan,
      },
    };
  }

  async approve(user: JwtAccessPayload, detailOrSopId: string) {
    const context = await this.resolveTargetContext(detailOrSopId);
    const authority = await this.authorityService.assertCanApprove(user.sub, context.processId);
    const statusContext = await this.sopCatalogRepository.findLatestDetailStatusContext(
      context.detailSopId,
    );
    if (statusContext === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (statusContext.status !== StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR) {
      throw new ConflictException(
        `SOP belum siap untuk final approval (status saat ini: ${String(statusContext.status)})`,
      );
    }

    const acceptedReview = await this.prisma.processReview.findFirst({
      where: {
        detailSopId: context.detailSopId,
        processId: context.processId,
        decision: ProcessReviewDecision.ACCEPT,
        nextStatus: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
      },
      orderBy: { createdAt: 'desc' },
      select: { processReviewId: true },
    });

    try {
      return await this.prisma.processFinalApproval.create({
        data: {
          detailSopId: context.detailSopId,
          processId: context.processId,
          approvedById: user.sub,
          processReviewId: acceptedReview?.processReviewId ?? null,
          authority: authority.authority,
          authorityKey: authority.authorityKey,
        },
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('SOP version ini sudah mendapat final approval');
      }
      throw error;
    }
  }

  private async resolveTargetContext(detailOrSopId: string): Promise<{
    detailSopId: string;
    processId: string;
  }> {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    const latest = await this.prisma.detailSOP.findFirst({
      where: { sopId: resolved.sopId },
      orderBy: { versi: 'desc' },
      select: { detailSopId: true },
    });
    if (latest === null) {
      throw new NotFoundException('DetailSOP terbaru tidak ditemukan');
    }
    if (latest.detailSopId !== resolved.detailSopId) {
      throw new ConflictException('Final approval hanya dapat diberikan pada versi SOP terbaru');
    }
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });
    if (sop?.processId === null || sop === null) {
      throw new ConflictException(
        'SOP legacy belum terikat Process dan tetap memakai workflow kompatibilitas',
      );
    }
    return { detailSopId: resolved.detailSopId, processId: sop.processId };
  }
}
