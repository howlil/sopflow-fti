import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusSOP } from '../../../generated/prisma';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';

const ASSIGNABLE_STATUSES: StatusSOP[] = [
  StatusSOP.DRAFT,
  StatusSOP.REVISION_REQUIRED,
  StatusSOP.PROCESS_REVIEW,
];

@Injectable()
export class PenugasanPenyusunSopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prosesBisnisContextService: ProsesBisnisContextService,
  ) {}

  async listForOwner(penggunaId: string, prosesBisnisId: string) {
    const prosesBisnis = await this.prosesBisnisContextService.assertCanReview(
      penggunaId,
      prosesBisnisId,
    );

    const [sops, assignments] = await Promise.all([
      this.prisma.sOP.findMany({
        where: { prosesBisnisId },
        select: {
          sopId: true,
          judul: true,
          detailSops: {
            orderBy: { versi: 'desc' },
            take: 1,
            select: {
              detailSopId: true,
              nomorSOP: true,
              versi: true,
              status: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.penugasanPenyusunSOP.findMany({ where: { prosesBisnisId } }),
    ]);

    const assignmentBySopId = new Map(assignments.map((row) => [row.sopId, row]));
    const penyusunIds = [...new Set(assignments.map((row) => row.penyusunId))];
    const penyusun = penyusunIds.length === 0
      ? []
      : await this.prisma.pengguna.findMany({
          where: { penggunaId: { in: penyusunIds } },
          select: { penggunaId: true, nama: true, email: true, deletedAt: true },
        });
    const penyusunById = new Map(penyusun.map((row) => [row.penggunaId, row]));

    return sops.map((sop) => {
      const latest = sop.detailSops[0] ?? null;
      const assignment = assignmentBySopId.get(sop.sopId) ?? null;
      const assignedUser = assignment ? penyusunById.get(assignment.penyusunId) ?? null : null;
      return {
        sopId: sop.sopId,
        detailSopId: latest?.detailSopId ?? null,
        judul: sop.judul,
        nomorSOP: latest?.nomorSOP ?? null,
        versi: latest?.versi ?? null,
        status: latest?.status ?? null,
        updatedAt: latest?.updatedAt ?? null,
        prosesBisnisId: prosesBisnis.prosesBisnisId,
        namaProsesBisnis: prosesBisnis.nama,
        penyusun: assignment && assignedUser
          ? {
              penggunaId: assignedUser.penggunaId,
              nama: assignedUser.nama,
              email: assignedUser.email,
              aktif: assignedUser.deletedAt === null,
              ditugaskanPada: assignment.ditugaskanPada,
            }
          : null,
      };
    });
  }

  async assign(penggunaId: string, sopId: string, penyusunId: string) {
    const sop = await this.prisma.sOP.findUnique({
      where: { sopId },
      select: {
        sopId: true,
        prosesBisnisId: true,
        detailSops: {
          orderBy: { versi: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });
    if (sop === null) throw new NotFoundException('SOP tidak ditemukan');
    if (sop.prosesBisnisId === null) {
      throw new ConflictException('SOP arsip tanpa Proses Bisnis tidak dapat diberi penugasan Penyusun');
    }

    await this.prosesBisnisContextService.assertCanReview(penggunaId, sop.prosesBisnisId);

    const latestStatus = sop.detailSops[0]?.status ?? null;
    if (latestStatus === null || !ASSIGNABLE_STATUSES.includes(latestStatus)) {
      throw new ConflictException(
        'Penugasan Penyusun hanya dapat diubah saat SOP masih dalam penyusunan, revisi, atau pemeriksaan',
      );
    }

    const member = await this.prisma.anggotaProsesBisnis.findUnique({
      where: {
        prosesBisnisId_penggunaId: {
          prosesBisnisId: sop.prosesBisnisId,
          penggunaId: penyusunId,
        },
      },
      include: {
        pengguna: {
          select: { penggunaId: true, nama: true, email: true, deletedAt: true },
        },
      },
    });
    if (member === null || member.pengguna.deletedAt !== null) {
      throw new ConflictException('Penyusun harus Anggota Proses Bisnis yang aktif');
    }

    const assignment = await this.prisma.penugasanPenyusunSOP.upsert({
      where: { sopId },
      create: {
        sopId,
        prosesBisnisId: sop.prosesBisnisId,
        penyusunId,
        ditugaskanOlehId: penggunaId,
      },
      update: {
        prosesBisnisId: sop.prosesBisnisId,
        penyusunId,
        ditugaskanOlehId: penggunaId,
        ditugaskanPada: new Date(),
      },
    });

    return {
      sopId,
      prosesBisnisId: sop.prosesBisnisId,
      penyusun: {
        penggunaId: member.pengguna.penggunaId,
        nama: member.pengguna.nama,
        email: member.pengguna.email,
      },
      ditugaskanPada: assignment.ditugaskanPada,
    };
  }
}
