import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PejabatBerwenang, LingkupOrganisasi, StatusSOP } from '../../../generated/prisma';
import { displayStatusSop } from '../../../common/status/status-display';
import { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import { mapWorkbenchPayload } from '../catalog/sop-catalog.mapper';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { projectProsesBisnisSopLifecycle } from './sop-proses-bisnis-siklus.projection';

@Injectable()
export class ProsesBisnisSopLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: PejabatBerwenangService,
    private readonly sopCatalogRepository: SopCatalogRepository,
  ) {}

  async listLifecycleForCurrentAuthority(user: JwtAccessPayload) {
    const prosesBisnis = await this.listScopedProcesses(user.sub);
    const details = prosesBisnis.length === 0
      ? []
      : await this.prisma.detailSOP.findMany({
          where: { sop: { prosesBisnisId: { in: prosesBisnis.map((item) => item.prosesBisnisId) } } },
          select: {
            detailSopId: true,
            sopId: true,
            nomorSOP: true,
            status: true,
            versi: true,
            updatedAt: true,
            sop: { select: { judul: true, prosesBisnisId: true } },
          },
          orderBy: [{ sopId: 'asc' }, { versi: 'desc' }],
        });
    const latestBySopId = new Map<string, (typeof details)[number]>();
    for (const detail of details) {
      if (!latestBySopId.has(detail.sopId)) latestBySopId.set(detail.sopId, detail);
    }
    const authorityByProcess = await this.resolveAuthorities(prosesBisnis);
    const rowsByProcess = new Map<string, Array<Record<string, unknown>>>();
    for (const detail of latestBySopId.values()) {
      const process = prosesBisnis.find((item) => item.prosesBisnisId === detail.sop.prosesBisnisId);
      if (process === undefined) continue;
      const authority = authorityByProcess.get(process.prosesBisnisId) ?? null;
      const siklus = projectProsesBisnisSopLifecycle({
        status: detail.status,
        currentUserId: user.sub,
        prosesBisnis: {
          lingkup: process.lingkup,
          penanggungJawabId: process.penanggungJawabId,
          namaPenanggungJawab: process.penanggungJawab.nama,
          namaDepartemen: process.departemen?.nama ?? null,
        },
        authority: authority === null ? null : { holderId: authority.holderId, holderName: authority.holderName },
      });
      const row = {
        detailSopId: detail.detailSopId,
        sopId: detail.sopId,
        judul: detail.sop.judul,
        nomorSOP: detail.nomorSOP,
        versi: detail.versi,
        status: detail.status,
        statusLabel: displayStatusSop(detail.status).label,
        updatedAt: detail.updatedAt,
        siklus,
      };
      const rows = rowsByProcess.get(process.prosesBisnisId) ?? [];
      rows.push(row);
      rowsByProcess.set(process.prosesBisnisId, rows);
    }

    return prosesBisnis.map((process) => {
      const rows = rowsByProcess.get(process.prosesBisnisId) ?? [];
      const statusCounts = rows.reduce<Record<string, number>>((counts, row) => {
        const status = String(row.status);
        counts[status] = (counts[status] ?? 0) + 1;
        return counts;
      }, {});
      return {
        prosesBisnisId: process.prosesBisnisId,
        namaProsesBisnis: process.nama,
        lingkup: process.lingkup,
        departemenId: process.departemenId,
        departmentNama: process.departemen?.nama ?? null,
        jumlahSop: rows.length,
        statusCounts,
        sops: rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      };
    });
  }

  async listForCurrentSigner(user: JwtAccessPayload) {
    const groups = await this.listLifecycleForCurrentAuthority(user);
    const pending = groups.flatMap((group) =>
      group.sops
        .filter((row) => row.status === StatusSOP.TTE_PENDING)
        .map((row) => ({ ...row, prosesBisnisId: group.prosesBisnisId, namaProsesBisnis: group.namaProsesBisnis })),
    );
    const processIds = groups.map((group) => group.prosesBisnisId);
    const signed = processIds.length === 0
      ? []
      : await this.prisma.riwayatTandaTangan.findMany({
          where: {
            userId: user.sub,
            dokumenTte: {
              is: {
                jenisDokumen: 'SOP_BERLAKU',
                prosesBisnisId: { in: processIds },
              },
            },
          },
          select: {
            dokumenTteId: true,
            ditandatanganiPada: true,
            authority: true,
            dokumenTte: {
              select: {
                detailSopId: true,
                nomorDokumen: true,
                judulDokumen: true,
                prosesBisnisId: true,
                detailSop: { select: { sopId: true, versi: true, status: true } },
              },
            },
          },
          orderBy: { ditandatanganiPada: 'desc' },
        });
    return { pending, completed: signed };
  }

  private async listScopedProcesses(userId: string) {
    const assignments = await this.authorityService.listMine(userId);
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

    return this.prisma.prosesBisnis.findMany({
      where: {
        OR: [
          ...(isDean ? [{ lingkup: LingkupOrganisasi.FACULTY }] : []),
          ...(departemenIds.length > 0
            ? [{ lingkup: LingkupOrganisasi.DEPARTMENT, departemenId: { in: departemenIds } }]
            : []),
        ],
      },
      select: {
        prosesBisnisId: true,
        nama: true,
        lingkup: true,
        departemenId: true,
        penanggungJawabId: true,
        departemen: { select: { nama: true } },
        penanggungJawab: { select: { nama: true } },
      },
    });
  }

  private async resolveAuthorities(prosesBisnis: Awaited<ReturnType<ProsesBisnisSopLifecycleService['listScopedProcesses']>>) {
    const keys = prosesBisnis.map((process) =>
      process.lingkup === LingkupOrganisasi.FACULTY
        ? 'DEAN'
        : process.departemenId === null
          ? null
          : `HEAD_OF_DEPARTMENT:${process.departemenId}`,
    ).filter((key): key is string => key !== null);
    const assignments = keys.length === 0
      ? []
      : await this.prisma.penugasanPejabatBerwenang.findMany({
          where: { kunciPejabatBerwenang: { in: keys } },
          select: { kunciPejabatBerwenang: true, holderId: true, authority: true, departemenId: true },
        });
    const holders = assignments.length === 0
      ? []
      : await this.prisma.pengguna.findMany({
          where: { penggunaId: { in: assignments.map((item) => item.holderId) }, deletedAt: null },
          select: { penggunaId: true, nama: true },
        });
    const holderById = new Map(holders.map((holder) => [holder.penggunaId, holder.nama]));
    const assignmentByKey = new Map(assignments.map((assignment) => [assignment.kunciPejabatBerwenang, assignment]));
    return new Map(prosesBisnis.map((process) => {
      const key = process.lingkup === LingkupOrganisasi.FACULTY
        ? 'DEAN'
        : process.departemenId === null
          ? null
          : `HEAD_OF_DEPARTMENT:${process.departemenId}`;
      const assignment = key === null ? undefined : assignmentByKey.get(key);
      return [process.prosesBisnisId, assignment === undefined
        ? null
        : { holderId: assignment.holderId, holderName: holderById.get(assignment.holderId) ?? null }];
    }));
  }

  async getDocumentForCurrentSigner(user: JwtAccessPayload, detailOrSopId: string) {
    const context = await this.resolveTargetContext(detailOrSopId);
    const authority = await this.authorityService.assertCurrentAuthorityHolder(user.sub, context.prosesBisnisId);
    const row = await this.sopCatalogRepository.findWorkbenchPayloadByDetailOrSopId(
      context.detailSopId,
    );
    if (row === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    return {
      workbench: mapWorkbenchPayload(row),
      authority: {
        authority: authority.authority,
        kunciPejabatBerwenang: authority.kunciPejabatBerwenang,
        holderId: authority.holderId,
        holderName: authority.holderName,
        holderNip: authority.holderNip,
        holderJabatan: authority.holderJabatan,
      },
    };
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
      throw new ConflictException('TTE hanya dapat dilakukan pada versi SOP terbaru');
    }
    return { detailSopId: resolved.detailSopId, prosesBisnisId: resolved.prosesBisnisId };
  }
}
