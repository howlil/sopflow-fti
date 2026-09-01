import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PeranPengguna } from '../../../generated/prisma';
import type {
  ActionablePengajuan,
  ActiveNotificationRecipient,
  ClaimedNotificationReminder,
  DesiredNotificationReminder,
  InAppNotificationRecord,
} from './notification-reminder.types';
import { ACTIONABLE_REMINDER_STATUSES } from './notification-reminder.types';

const NOTIFICATION_ROLES: readonly PeranPengguna[] = [
  PeranPengguna.EVALUATOR,
  PeranPengguna.PJ_EVALUATOR,
  PeranPengguna.PJ_PENYUSUN,
  PeranPengguna.KEPALA_OPD,
] as const;

@Injectable()
export class NotificationReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActionablePengajuan(): Promise<ActionablePengajuan[]> {
    const rows = await this.prisma.pengajuanEvaluasi.findMany({
      where: { status: { in: [...ACTIONABLE_REMINDER_STATUSES] } },
      select: {
        pengajuanEvaluasiId: true,
        opdId: true,
        nomorBA: true,
        status: true,
        opd: { select: { nama: true } },
        _count: { select: { nilaiEvaluasi: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      pengajuanEvaluasiId: row.pengajuanEvaluasiId,
      opdId: row.opdId,
      opdNama: row.opd.nama,
      nomorBA: row.nomorBA,
      status: row.status,
      jumlahSop: row._count.nilaiEvaluasi,
    }));
  }

  async findActiveRecipients(): Promise<ActiveNotificationRecipient[]> {
    return this.prisma.pengguna.findMany({
      where: { deletedAt: null, peran: { in: [...NOTIFICATION_ROLES] } },
      select: { penggunaId: true, opdId: true, email: true, nama: true, peran: true, nohp: true },
      orderBy: { penggunaId: 'asc' },
    });
  }

  async findExistingReminders(): Promise<
    Array<{
      notificationReminderId: string;
      pengajuanEvaluasiId: string;
      penggunaId: string;
      kind: DesiredNotificationReminder['kind'];
    }>
  > {
    const rows = await this.prisma.pengingatWhatsApp.findMany({
      select: {
        pengingatWhatsAppId: true,
        pengajuanEvaluasiId: true,
        penggunaId: true,
        jenis: true,
      },
    });
    return rows.map((r) => ({
      notificationReminderId: r.pengingatWhatsAppId,
      pengajuanEvaluasiId: r.pengajuanEvaluasiId,
      penggunaId: r.penggunaId,
      kind: r.jenis,
    }));
  }

  async upsertDesiredReminder(reminder: DesiredNotificationReminder, now: Date): Promise<void> {
    await this.prisma.pengingatWhatsApp.upsert({
      where: {
        pengajuanEvaluasiId_penggunaId_jenis: {
          pengajuanEvaluasiId: reminder.pengajuanEvaluasiId,
          penggunaId: reminder.penggunaId,
          jenis: reminder.kind,
        },
      },
      create: {
        pengajuanEvaluasiId: reminder.pengajuanEvaluasiId,
        penggunaId: reminder.penggunaId,
        jenis: reminder.kind,
        nomorTujuan: reminder.destination,
        nextSendAt: now,
      },
      update: { nomorTujuan: reminder.destination },
    });
  }

  async createInAppNotificationIfMissing(
    reminder: DesiredNotificationReminder,
    now: Date,
  ): Promise<boolean> {
    const result = await this.prisma.notifikasiInApp.createMany({
      data: [
        {
          pengajuanEvaluasiId: reminder.pengajuanEvaluasiId,
          penggunaId: reminder.penggunaId,
          jenis: reminder.kind,
          createdAt: now,
        },
      ],
      skipDuplicates: true,
    });
    return result.count === 1;
  }

  async deleteReminderIds(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const result = await this.prisma.pengingatWhatsApp.deleteMany({
      where: { pengingatWhatsAppId: { in: [...ids] } },
    });
    return result.count;
  }

  async findDueCandidateIds(now: Date, take: number): Promise<string[]> {
    const rows = await this.prisma.pengingatWhatsApp.findMany({
      where: {
        nextSendAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      select: { pengingatWhatsAppId: true },
      orderBy: [{ nextSendAt: 'asc' }, { createdAt: 'asc' }],
      take,
    });
    return rows.map((row) => row.pengingatWhatsAppId);
  }

  async tryClaim(
    notificationReminderId: string,
    lockToken: string,
    now: Date,
    lockedUntil: Date,
  ): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.updateMany({
      where: {
        pengingatWhatsAppId: notificationReminderId,
        nextSendAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: { lockToken, lockedUntil },
    });
    return result.count === 1;
  }

  async releaseClaim(notificationReminderId: string, lockToken: string): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.updateMany({
      where: { pengingatWhatsAppId: notificationReminderId, lockToken },
      data: { lockToken: null, lockedUntil: null },
    });
    return result.count === 1;
  }

  async findClaimed(
    notificationReminderId: string,
    lockToken: string,
  ): Promise<ClaimedNotificationReminder | null> {
    const row = await this.prisma.pengingatWhatsApp.findFirst({
      where: { pengingatWhatsAppId: notificationReminderId, lockToken },
      select: {
        pengingatWhatsAppId: true,
        pengajuanEvaluasiId: true,
        penggunaId: true,
        jenis: true,
        nomorTujuan: true,
        lastSentAt: true,
        consecutiveFailures: true,
        lockToken: true,
        pengajuanEvaluasi: {
          select: {
            pengajuanEvaluasiId: true,
            opdId: true,
            nomorBA: true,
            status: true,
            opd: { select: { nama: true } },
            _count: { select: { nilaiEvaluasi: true } },
          },
        },
        pengguna: {
          select: {
            penggunaId: true,
            opdId: true,
            email: true,
            nama: true,
            peran: true,
            nohp: true,
            deletedAt: true,
          },
        },
      },
    });
    if (row === null) {
      return null;
    }
    return {
      notificationReminderId: row.pengingatWhatsAppId,
      pengajuanEvaluasiId: row.pengajuanEvaluasiId,
      penggunaId: row.penggunaId,
      kind: row.jenis,
      destination: row.nomorTujuan,
      lastSentAt: row.lastSentAt,
      consecutiveFailures: row.consecutiveFailures,
      lockToken: row.lockToken,
      pengajuanEvaluasi: {
        pengajuanEvaluasiId: row.pengajuanEvaluasi.pengajuanEvaluasiId,
        opdId: row.pengajuanEvaluasi.opdId,
        opdNama: row.pengajuanEvaluasi.opd.nama,
        nomorBA: row.pengajuanEvaluasi.nomorBA,
        status: row.pengajuanEvaluasi.status,
        jumlahSop: row.pengajuanEvaluasi._count.nilaiEvaluasi,
      },
      pengguna: row.pengguna,
    };
  }

  async findByIdentity(
    pengajuanEvaluasiId: string,
    penggunaId: string,
    kind: DesiredNotificationReminder['kind'],
  ): Promise<ClaimedNotificationReminder | null> {
    const row = await this.prisma.pengingatWhatsApp.findUnique({
      where: {
        pengajuanEvaluasiId_penggunaId_jenis: {
          pengajuanEvaluasiId,
          penggunaId,
          jenis: kind,
        },
      },
      select: {
        pengingatWhatsAppId: true,
        pengajuanEvaluasiId: true,
        penggunaId: true,
        jenis: true,
        nomorTujuan: true,
        lastSentAt: true,
        consecutiveFailures: true,
        lockToken: true,
        pengajuanEvaluasi: {
          select: {
            pengajuanEvaluasiId: true,
            opdId: true,
            nomorBA: true,
            status: true,
            opd: { select: { nama: true } },
            _count: { select: { nilaiEvaluasi: true } },
          },
        },
        pengguna: {
          select: {
            penggunaId: true,
            opdId: true,
            email: true,
            nama: true,
            peran: true,
            nohp: true,
            deletedAt: true,
          },
        },
      },
    });
    if (row === null) {
      return null;
    }
    return {
      notificationReminderId: row.pengingatWhatsAppId,
      pengajuanEvaluasiId: row.pengajuanEvaluasiId,
      penggunaId: row.penggunaId,
      kind: row.jenis,
      destination: row.nomorTujuan,
      lastSentAt: row.lastSentAt,
      consecutiveFailures: row.consecutiveFailures,
      lockToken: row.lockToken,
      pengajuanEvaluasi: {
        pengajuanEvaluasiId: row.pengajuanEvaluasi.pengajuanEvaluasiId,
        opdId: row.pengajuanEvaluasi.opdId,
        opdNama: row.pengajuanEvaluasi.opd.nama,
        nomorBA: row.pengajuanEvaluasi.nomorBA,
        status: row.pengajuanEvaluasi.status,
        jumlahSop: row.pengajuanEvaluasi._count.nilaiEvaluasi,
      },
      pengguna: row.pengguna,
    };
  }

  async accelerateNextSendAt(notificationReminderId: string, candidate: Date): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.updateMany({
      where: {
        pengingatWhatsAppId: notificationReminderId,
        nextSendAt: { gt: candidate },
      },
      data: { nextSendAt: candidate },
    });
    return result.count === 1;
  }

  async markSuccess(
    notificationReminderId: string,
    lockToken: string,
    sentAt: Date,
    nextSendAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.updateMany({
      where: { pengingatWhatsAppId: notificationReminderId, lockToken },
      data: {
        lastSentAt: sentAt,
        nextSendAt,
        consecutiveFailures: 0,
        lastErrorKind: null,
        lockToken: null,
        lockedUntil: null,
      },
    });
    return result.count === 1;
  }

  async markFailure(
    notificationReminderId: string,
    lockToken: string,
    nextSendAt: Date,
    errorKind: string,
  ): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.updateMany({
      where: { pengingatWhatsAppId: notificationReminderId, lockToken },
      data: {
        nextSendAt,
        consecutiveFailures: { increment: 1 },
        lastErrorKind: errorKind,
        lockToken: null,
        lockedUntil: null,
      },
    });
    return result.count === 1;
  }

  async deleteClaimed(notificationReminderId: string, lockToken: string): Promise<boolean> {
    const result = await this.prisma.pengingatWhatsApp.deleteMany({
      where: { pengingatWhatsAppId: notificationReminderId, lockToken },
    });
    return result.count === 1;
  }

  async countUnreadInApp(penggunaId: string): Promise<number> {
    return this.prisma.notifikasiInApp.count({
      where: { penggunaId, readAt: null },
    });
  }

  async findInAppNotifications(
    penggunaId: string,
    take: number,
  ): Promise<InAppNotificationRecord[]> {
    const rows = await this.prisma.notifikasiInApp.findMany({
      where: { penggunaId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take,
    });
    if (rows.length === 0) {
      return [];
    }

    const pengajuanIds = [...new Set(rows.map((row) => row.pengajuanEvaluasiId))];
    const [pengajuanRows, pengguna] = await Promise.all([
      this.prisma.pengajuanEvaluasi.findMany({
        where: { pengajuanEvaluasiId: { in: pengajuanIds } },
        select: {
          pengajuanEvaluasiId: true,
          opdId: true,
          nomorBA: true,
          status: true,
          opd: { select: { nama: true } },
          _count: { select: { nilaiEvaluasi: true } },
        },
      }),
      this.prisma.pengguna.findUnique({
        where: { penggunaId },
        select: {
          penggunaId: true,
          opdId: true,
          email: true,
          nama: true,
          peran: true,
          nohp: true,
          deletedAt: true,
        },
      }),
    ]);

    if (pengguna === null) {
      return [];
    }

    const pengajuanById = new Map(
      pengajuanRows.map((row) => [
        row.pengajuanEvaluasiId,
        {
          pengajuanEvaluasiId: row.pengajuanEvaluasiId,
          opdId: row.opdId,
          opdNama: row.opd.nama,
          nomorBA: row.nomorBA,
          status: row.status,
          jumlahSop: row._count.nilaiEvaluasi,
        },
      ]),
    );

    const notifications: InAppNotificationRecord[] = [];
    for (const row of rows) {
      const pengajuanEvaluasi = pengajuanById.get(row.pengajuanEvaluasiId);
      if (pengajuanEvaluasi === undefined) {
        continue;
      }
      notifications.push({
        pengajuanEvaluasiId: row.pengajuanEvaluasiId,
        penggunaId: row.penggunaId,
        kind: row.jenis,
        readAt: row.readAt,
        createdAt: row.createdAt,
        pengajuanEvaluasi,
        pengguna,
      });
    }
    return notifications;
  }

  async markInAppRead(
    penggunaId: string,
    pengajuanEvaluasiId: string,
    kind: DesiredNotificationReminder['kind'],
    readAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.notifikasiInApp.updateMany({
      where: { penggunaId, pengajuanEvaluasiId, jenis: kind },
      data: { readAt },
    });
    return result.count === 1;
  }

  async markAllInAppRead(penggunaId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notifikasiInApp.updateMany({
      where: { penggunaId, readAt: null },
      data: { readAt },
    });
    return result.count;
  }
}
