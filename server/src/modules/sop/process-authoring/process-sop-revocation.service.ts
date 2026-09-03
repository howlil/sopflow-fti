import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { hasRevisiInFlight } from '../../../common/status/sop-editable.util';
import {
  BagianSOP,
  JenisDokumenTte,
  OrganizationalAuthority,
  OrganizationalScope,
  ProcessNotificationKind,
  StatusSOP,
} from '../../../generated/prisma';
import { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import { ProcessNotificationService } from '../../notifications/process/process-notification.service';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';

type ProcessRevocationQueueRow = {
  detailSopId: string;
  sopId: string;
  judul: string;
  nomorSOP: string;
  versi: number;
  processId: string;
  processNama: string;
  scope: OrganizationalScope;
  departmentId: string | null;
  departmentNama: string | null;
  updatedAt: Date;
};

@Injectable()
export class ProcessSopRevocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: OrganizationalAuthorityService,
    private readonly processNotificationService: ProcessNotificationService,
    private readonly sopCatalogRepository: SopCatalogRepository,
  ) {}

  async listForCurrentAuthority(user: JwtAccessPayload): Promise<ProcessRevocationQueueRow[]> {
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
    const bindings = await this.prisma.processSopBinding.findMany({
      where: { processId: { in: processes.map((process) => process.processId) } },
      select: { sopId: true, processId: true },
    });
    if (bindings.length === 0) return [];

    const details = await this.prisma.detailSOP.findMany({
      where: { sopId: { in: bindings.map((binding) => binding.sopId) } },
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

    const detailsBySopId = new Map<string, (typeof details)[number][]>();
    for (const detail of details) {
      const rows = detailsBySopId.get(detail.sopId) ?? [];
      rows.push(detail);
      detailsBySopId.set(detail.sopId, rows);
    }

    const rows: ProcessRevocationQueueRow[] = [];
    for (const binding of bindings) {
      const process = processById.get(binding.processId);
      const sopDetails = detailsBySopId.get(binding.sopId) ?? [];
      if (!process || sopDetails.length === 0) continue;
      if (hasRevisiInFlight(sopDetails.map((detail) => detail.status))) continue;
      const effective = sopDetails.find((detail) => detail.status === StatusSOP.BERLAKU);
      if (!effective) continue;
      rows.push({
        detailSopId: effective.detailSopId,
        sopId: effective.sopId,
        judul: effective.sop.judul,
        nomorSOP: effective.nomorSOP,
        versi: effective.versi,
        processId: process.processId,
        processNama: process.nama,
        scope: process.scope,
        departmentId: process.departmentId,
        departmentNama: process.department?.nama ?? null,
        updatedAt: effective.updatedAt,
      });
    }
    return rows;
  }

  async revoke(user: JwtAccessPayload, detailOrSopId: string) {
    const resolved = await this.sopCatalogRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }

    const binding = await this.prisma.processSopBinding.findUnique({
      where: { sopId: resolved.sopId },
      select: { processId: true },
    });
    if (binding === null) {
      throw new ConflictException(
        'SOP legacy belum terikat Process dan tetap memakai workflow kompatibilitas',
      );
    }

    await this.authorityService.assertCanApprove(user.sub, binding.processId);

    const history = await this.sopCatalogRepository.findRiwayatVersiBySopId(resolved.sopId);
    if (hasRevisiInFlight(history.map((row) => row.status))) {
      throw new ConflictException(
        'Tidak dapat mencabut SOP karena masih ada revisi yang sedang berjalan. Selesaikan atau batalkan revisi terlebih dahulu.',
      );
    }
    const effective = history.find((row) => row.status === StatusSOP.BERLAKU);
    if (effective === undefined) {
      throw new ConflictException('SOP tidak memiliki versi berlaku yang dapat dicabut');
    }

    const [process, detail] = await Promise.all([
      this.prisma.process.findUnique({
        where: { processId: binding.processId },
        select: { ownerId: true, nama: true },
      }),
      this.prisma.detailSOP.findUnique({
        where: { detailSopId: effective.detailSopId },
        select: { dibuatOlehId: true },
      }),
    ]);
    if (process === null || detail === null) {
      throw new NotFoundException('Context Process SOP tidak ditemukan');
    }
    if (detail.dibuatOlehId === null) {
      throw new ConflictException('Author SOP Process tidak tersedia untuk feedback pencabutan');
    }

    const revokedAt = new Date();
    let notifiedRecipients: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.detailSOP.updateMany({
        where: {
          detailSopId: effective.detailSopId,
          status: StatusSOP.BERLAKU,
        },
        data: {
          status: StatusSOP.DICABUT,
          terakhirDieditOlehId: user.sub,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Status SOP berubah saat pencabutan diproses. Muat ulang lalu ulangi aksi.',
        );
      }

      await appendOrCreateLogSession({
        tx,
        detailSopId: effective.detailSopId,
        penggunaId: user.sub,
        bagian: BagianSOP.STATUS,
        fields: ['status'],
        discrete: true,
      });
      await tx.$executeRaw`
        UPDATE DokumenTte
        SET pdfStatus = ${'REVOKED'},
            pdfRevokedAt = ${revokedAt}
        WHERE detailSopId = ${effective.detailSopId}
          AND jenisDokumen = ${JenisDokumenTte.SOP_BERLAKU}
      `;

      notifiedRecipients = await this.processNotificationService.createManyInTransaction(tx, [
        {
          detailSopId: effective.detailSopId,
          sopId: resolved.sopId,
          processId: binding.processId,
          penggunaId: detail.dibuatOlehId,
          kind: ProcessNotificationKind.PROCESS_SOP_REVOKED,
          processName: process.nama,
        },
        {
          detailSopId: effective.detailSopId,
          sopId: resolved.sopId,
          processId: binding.processId,
          penggunaId: process.ownerId,
          kind: ProcessNotificationKind.PROCESS_SOP_REVOKED,
          processName: process.nama,
        },
      ]);
    });
    this.processNotificationService.emitChangedMany(notifiedRecipients);

    return {
      detailSopId: effective.detailSopId,
      sopId: resolved.sopId,
      processId: binding.processId,
      status: StatusSOP.DICABUT,
    };
  }
}
