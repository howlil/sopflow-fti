import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { isPrismaUniqueConstraintError } from '../../../common/prisma/prisma-error.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  PejabatBerwenang,
  LingkupOrganisasi,
  KeputusanPemeriksaanProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import { PejabatBerwenangService } from '../../core/process/organizational-authority.service';
import { mapWorkbenchPayload } from '../catalog/sop-catalog.mapper';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';

@Injectable()
export class PersetujuanAkhirSOPService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: PejabatBerwenangService,
    private readonly sopCatalogRepository: SopCatalogRepository,
  ) {}

  async listForCurrentApprover(user: JwtAccessPayload) {
    const assignments = await this.authorityService.listMine(user.sub);
    if (assignments.length === 0) return [];

    const isDean = assignments.some(
      (assignment) => assignment.authority === PejabatBerwenang.DEAN,
    );
    const departemenIds = assignments
      .filter(
        (assignment) =>
          assignment.authority === PejabatBerwenang.HEAD_OF_DEPARTMENT &&
          assignment.departemenId !== null,
      )
      .map((assignment) => assignment.departemenId as string);
    if (!isDean && departemenIds.length === 0) return [];

    const processes = await this.prisma.prosesBisnis.findMany({
      where: {
        OR: [
          ...(isDean ? [{ scope: LingkupOrganisasi.FACULTY }] : []),
          ...(departemenIds.length > 0
            ? [{ scope: LingkupOrganisasi.DEPARTMENT, departemenId: { in: departemenIds } }]
            : []),
        ],
      },
      select: {
        prosesBisnisId: true,
        nama: true,
        scope: true,
        departemenId: true,
        department: { select: { nama: true } },
      },
    });
    if (processes.length === 0) return [];

    const processById = new Map(processes.map((process) => [process.prosesBisnisId, process]));
    const nativeSops = await this.prisma.sOP.findMany({
      where: { prosesBisnisId: { in: processes.map((process) => process.prosesBisnisId) } },
      select: { sopId: true, prosesBisnisId: true },
    });
    if (nativeSops.length === 0) return [];

    const processBySopId = new Map(
      nativeSops
        .filter((sop): sop is typeof sop & { prosesBisnisId: string } => sop.prosesBisnisId !== null)
        .map((sop) => [sop.sopId, sop.prosesBisnisId]),
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
    const approvalLatest = [...latestBySopId.values()].filter(
      (detail) =>
        detail.status === StatusSOP.FINAL_APPROVAL || detail.status === StatusSOP.TTE_PENDING,
    );
    const approvals =
      approvalLatest.length === 0
        ? []
        : await this.prisma.persetujuanAkhirSOP.findMany({
            where: { detailSopId: { in: approvalLatest.map((detail) => detail.detailSopId) } },
          });
    const approvalByDetail = new Map(approvals.map((approval) => [approval.detailSopId, approval]));

    return approvalLatest.map((detail) => {
      const prosesBisnisId = processBySopId.get(detail.sopId);
      if (!prosesBisnisId)
        throw new Error('Proses Bisnis SOP ownership disappeared while listing approval queue');
      const process = processById.get(prosesBisnisId);
      if (!process) throw new Error('Proses Bisnis disappeared while listing approval queue');
      const approval = approvalByDetail.get(detail.detailSopId) ?? null;
      return {
        detailSopId: detail.detailSopId,
        sopId: detail.sopId,
        judul: detail.sop.judul,
        nomorSOP: detail.nomorSOP,
        versi: detail.versi,
        prosesBisnisId: process.prosesBisnisId,
        processNama: process.nama,
        scope: process.scope,
        departemenId: process.departemenId,
        departmentNama: process.department?.nama ?? null,
        approval,
        updatedAt: detail.updatedAt,
      };
    });
  }

  async getContext(user: JwtAccessPayload, detailOrSopId: string) {
    const context = await this.resolveTargetContext(detailOrSopId);
    const resolved = await this.authorityService.resolveForProsesBisnis(context.prosesBisnisId);
    const approval = await this.prisma.persetujuanAkhirSOP.findUnique({
      where: { detailSopId: context.detailSopId },
    });
    return {
      detailSopId: context.detailSopId,
      prosesBisnisId: context.prosesBisnisId,
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
    const authority = await this.authorityService.assertCanApprove(user.sub, context.prosesBisnisId);
    const row = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
      context.detailSopId,
      0,
    );
    if (row === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    if (row.status !== StatusSOP.FINAL_APPROVAL && row.status !== StatusSOP.TTE_PENDING) {
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
    const authority = await this.authorityService.assertCanApprove(user.sub, context.prosesBisnisId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const statusContext = await tx.detailSOP.findUnique({
          where: { detailSopId: context.detailSopId },
          select: { status: true },
        });
        if (statusContext === null) {
          throw new NotFoundException('DetailSOP tidak ditemukan');
        }
        if (statusContext.status !== StatusSOP.FINAL_APPROVAL) {
          throw new ConflictException(
            `SOP belum siap untuk final approval (status saat ini: ${String(statusContext.status)})`,
          );
        }

        const acceptedReview = await tx.pemeriksaanProsesBisnis.findFirst({
          where: {
            detailSopId: context.detailSopId,
            prosesBisnisId: context.prosesBisnisId,
            decision: KeputusanPemeriksaanProsesBisnis.ACCEPT,
            nextStatus: StatusSOP.FINAL_APPROVAL,
          },
          orderBy: { createdAt: 'desc' },
          select: { pemeriksaanProsesBisnisId: true },
        });
        if (acceptedReview === null) {
          throw new ConflictException('Final approval membutuhkan Penanggung Jawab Proses Bisnis review yang diterima');
        }

        const updated = await tx.detailSOP.updateMany({
          where: { detailSopId: context.detailSopId, status: StatusSOP.FINAL_APPROVAL },
          data: { status: StatusSOP.TTE_PENDING, terakhirDieditOlehId: user.sub },
        });
        if (updated.count !== 1) {
          throw new ConflictException(
            'Status SOP berubah saat persetujuan akhir diproses. Muat ulang lalu coba lagi.',
          );
        }

        return tx.persetujuanAkhirSOP.create({
          data: {
            detailSopId: context.detailSopId,
            prosesBisnisId: context.prosesBisnisId,
            approvedById: user.sub,
            pemeriksaanProsesBisnisId: acceptedReview.pemeriksaanProsesBisnisId,
            authority: authority.authority,
            authorityKey: authority.authorityKey,
          },
        });
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('SOP version ini sudah mendapat persetujuan akhir');
      }
      throw error;
    }
  }

  private async resolveTargetContext(detailOrSopId: string): Promise<{
    detailSopId: string;
    prosesBisnisId: string;
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
      select: { prosesBisnisId: true },
    });
    if (sop?.prosesBisnisId === null || sop === null) {
      throw new ConflictException('SOP arsip tanpa Proses Bisnis tidak dapat masuk approval FTI');
    }
    return { detailSopId: resolved.detailSopId, prosesBisnisId: sop.prosesBisnisId };
  }
}
