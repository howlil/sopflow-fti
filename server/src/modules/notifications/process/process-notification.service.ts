import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProcessNotificationKind } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationEventsService } from '../reminders/notification-events.service';

export type ProcessNotificationCreateInput = Readonly<{
  detailSopId: string;
  sopId: string;
  processId: string;
  penggunaId: string;
  kind: ProcessNotificationKind;
  processName: string;
  authorityLabel?: string;
}>;

export type ProcessInAppNotification = Readonly<{
  processNotificationId: string;
  kind: ProcessNotificationKind;
  title: string;
  preview: string;
  body: string;
  actionHref: string;
  readAt: Date | null;
  createdAt: Date;
}>;

@Injectable()
export class ProcessNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  async getSummary(penggunaId: string): Promise<{ unreadCount: number }> {
    return {
      unreadCount: await this.prisma.processNotification.count({
        where: { penggunaId, readAt: null },
      }),
    };
  }

  async findMine(penggunaId: string, limit: number): Promise<ProcessInAppNotification[]> {
    return this.prisma.processNotification.findMany({
      where: { penggunaId },
      select: {
        processNotificationId: true,
        kind: true,
        title: true,
        preview: true,
        body: true,
        actionHref: true,
        readAt: true,
        createdAt: true,
      },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: this.normalizeLimit(limit),
    });
  }

  async markRead(
    penggunaId: string,
    processNotificationId: string,
  ): Promise<{ unreadCount: number }> {
    const updated = await this.prisma.processNotification.updateMany({
      where: { processNotificationId, penggunaId },
      data: { readAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new NotFoundException('Notifikasi Process tidak ditemukan');
    }
    this.notificationEvents.emitChanged(penggunaId);
    return this.getSummary(penggunaId);
  }

  async markAllRead(
    penggunaId: string,
  ): Promise<{ unreadCount: number; updated: number }> {
    const result = await this.prisma.processNotification.updateMany({
      where: { penggunaId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count > 0) {
      this.notificationEvents.emitChanged(penggunaId);
    }
    return { unreadCount: 0, updated: result.count };
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    input: ProcessNotificationCreateInput,
  ): Promise<void> {
    const message = this.buildMessage(input);
    await tx.processNotification.create({
      data: {
        detailSopId: input.detailSopId,
        sopId: input.sopId,
        processId: input.processId,
        penggunaId: input.penggunaId,
        kind: input.kind,
        ...message,
      },
    });
  }

  emitChanged(penggunaId: string): void {
    this.notificationEvents.emitChanged(penggunaId);
  }

  private buildMessage(input: ProcessNotificationCreateInput): {
    title: string;
    preview: string;
    body: string;
    actionHref: string;
  } {
    if (input.kind === ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED) {
      return {
        title: 'Review SOP Process diperlukan',
        preview: `SOP pada Process ${input.processName} menunggu review Anda.`,
        body: `SOP Process ${input.processName} telah disubmit dan menunggu keputusan Process Owner.`,
        actionHref: '/work/queue',
      };
    }

    const authority = input.authorityLabel ?? 'kewenangan organisasi';
    return {
      title: 'Persetujuan akhir SOP diperlukan',
      preview: `SOP pada Process ${input.processName} menunggu persetujuan akhir Anda.`,
      body: `SOP Process ${input.processName} telah diterima Process Owner dan menunggu persetujuan ${authority}.`,
      actionHref: '/approval',
    };
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) return 10;
    return Math.min(Math.max(Math.trunc(limit), 1), 50);
  }
}
