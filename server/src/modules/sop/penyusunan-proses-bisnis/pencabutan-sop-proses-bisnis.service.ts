import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { hasRevisiInFlight } from '../lifecycle/sop-editable.util';
import {
  BagianSOP,
  JenisDokumenTte,
  PejabatBerwenang,
  LingkupOrganisasi,
  JenisNotifikasiProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import { NotifikasiProsesBisnisService } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';

type ProsesBisnisRevocationQueueRow = {
  detailSopId: string;
  sopId: string;
  judul: string;
  nomorSOP: string;
  versi: number;
  prosesBisnisId: string;
  namaProsesBisnis: string;
  lingkup: LingkupOrganisasi;
  departemenId: string | null;
  departmentNama: string | null;
  updatedAt: Date;
};

@Injectable()
export class ProsesBisnisSopRevocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: PejabatBerwenangService,
    private readonly notifikasiProsesBisnisService: NotifikasiProsesBisnisService,
    private readonly sopCatalogRepository: SopCatalogRepository,
  ) {}

  async listForCurrentAuthority(user: JwtAccessPayload): Promise<ProsesBisnisRevocationQueueRow[]> {
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

    const prosesBisnis = await this.prisma.prosesBisnis.findMany({
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
        departemen: { select: { nama: true } },
      },
    });
    if (prosesBisnis.length === 0) return [];

    const prosesBisnisById = new Map(prosesBisnis.map((prosesBisnis) => [prosesBisnis.prosesBisnisId, prosesBisnis]));
    const nativeSops = await this.prisma.sOP.findMany({
      where: { prosesBisnisId: { in: prosesBisnis.map((prosesBisnis) => prosesBisnis.prosesBisnisId) } },
      select: { sopId: true, prosesBisnisId: true },
    });
    if (nativeSops.length === 0) return [];

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

    const detailsBySopId = new Map<string, (typeof details)[number][]>();
    for (const detail of details) {
      const rows = detailsBySopId.get(detail.sopId) ?? [];
      rows.push(detail);
      detailsBySopId.set(detail.sopId, rows);
    }

    const rows: ProsesBisnisRevocationQueueRow[] = [];
    for (const sop of nativeSops) {
      if (sop.prosesBisnisId === null) continue;
      const prosesBisnis = prosesBisnisById.get(sop.prosesBisnisId);
      const sopDetails = detailsBySopId.get(sop.sopId) ?? [];
      if (!prosesBisnis || sopDetails.length === 0) continue;
      if (hasRevisiInFlight(sopDetails.map((detail) => detail.status))) continue;
      const effective = sopDetails.find((detail) => detail.status === StatusSOP.EFFECTIVE);
      if (!effective) continue;
      rows.push({
        detailSopId: effective.detailSopId,
        sopId: effective.sopId,
        judul: effective.sop.judul,
        nomorSOP: effective.nomorSOP,
        versi: effective.versi,
        prosesBisnisId: prosesBisnis.prosesBisnisId,
        namaProsesBisnis: prosesBisnis.nama,
        lingkup: prosesBisnis.lingkup,
        departemenId: prosesBisnis.departemenId,
        departmentNama: prosesBisnis.departemen?.nama ?? null,
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

    const sop = await this.prisma.sOP.findUnique({
      where: { sopId: resolved.sopId },
      select: { prosesBisnisId: true },
    });
    if (sop?.prosesBisnisId == null) {
      throw new ConflictException(
        'SOP tanpa Proses Bisnis hanya tersedia sebagai riwayat compatibility dan tidak dapat dicabut dari runtime FTI',
      );
    }
    const prosesBisnisId = sop.prosesBisnisId;

    await this.authorityService.assertCanApprove(user.sub, prosesBisnisId);

    const history = await this.sopCatalogRepository.findRiwayatVersiBySopId(resolved.sopId);
    if (hasRevisiInFlight(history.map((row) => row.status))) {
      throw new ConflictException(
        'Tidak dapat mencabut SOP karena masih ada revisi yang sedang berjalan. Selesaikan atau batalkan revisi terlebih dahulu.',
      );
    }
    const effective = history.find((row) => row.status === StatusSOP.EFFECTIVE);
    if (effective === undefined) {
      throw new ConflictException('SOP tidak memiliki versi berlaku yang dapat dicabut');
    }

    const [prosesBisnis, detail] = await Promise.all([
      this.prisma.prosesBisnis.findUnique({
        where: { prosesBisnisId },
        select: { penanggungJawabId: true, nama: true },
      }),
      this.prisma.detailSOP.findUnique({
        where: { detailSopId: effective.detailSopId },
        select: { dibuatOlehId: true },
      }),
    ]);
    if (prosesBisnis === null || detail === null) {
      throw new NotFoundException('Context Proses Bisnis SOP tidak ditemukan');
    }
    const authorId = detail.dibuatOlehId;
    if (authorId === null) {
      throw new ConflictException('Author SOP Proses Bisnis tidak tersedia untuk feedback pencabutan');
    }

    const revokedAt = new Date();
    let notifiedRecipients: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.detailSOP.updateMany({
        where: {
          detailSopId: effective.detailSopId,
          status: StatusSOP.EFFECTIVE,
        },
        data: {
          status: StatusSOP.REVOKED,
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

      notifiedRecipients = await this.notifikasiProsesBisnisService.createManyInTransaction(tx, [
        {
          detailSopId: effective.detailSopId,
          sopId: resolved.sopId,
          prosesBisnisId,
          penggunaId: authorId,
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED,
          namaProsesBisnis: prosesBisnis.nama,
        },
        {
          detailSopId: effective.detailSopId,
          sopId: resolved.sopId,
          prosesBisnisId,
          penggunaId: prosesBisnis.penanggungJawabId,
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED,
          namaProsesBisnis: prosesBisnis.nama,
        },
      ]);
    });
    this.notifikasiProsesBisnisService.emitChangedMany(notifiedRecipients);

    return {
      detailSopId: effective.detailSopId,
      sopId: resolved.sopId,
      prosesBisnisId,
      status: StatusSOP.REVOKED,
    };
  }
}
