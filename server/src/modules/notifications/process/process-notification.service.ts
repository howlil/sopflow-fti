import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma, JenisNotifikasiProsesBisnis } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationEventsService } from '../shared/notification-events.service';
import { PengingatProsesBisnisService } from './process-reminder.service';

function truncatePreview(value: string, maxLength = 255): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

export type NotifikasiProsesBisnisCreateInput = Readonly<{
  detailSopId: string;
  sopId: string;
  prosesBisnisId: string;
  penggunaId: string;
  kind: JenisNotifikasiProsesBisnis;
  namaProsesBisnis: string;
  authorityLabel?: string;
  catatan?: string;
}>;

export type ProsesBisnisInAppNotification = Readonly<{
  notifikasiProsesBisnisId: string;
  kind: JenisNotifikasiProsesBisnis;
  title: string;
  preview: string;
  body: string;
  actionHref: string;
  readAt: Date | null;
  createdAt: Date;
}>;

@Injectable()
export class NotifikasiProsesBisnisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEvents: NotificationEventsService,
    @Optional() private readonly pengingatProsesBisnisService?: PengingatProsesBisnisService,
  ) {}

  async getSummary(penggunaId: string): Promise<{ unreadCount: number }> {
    return {
      unreadCount: await this.prisma.notifikasiProsesBisnis.count({
        where: { penggunaId, readAt: null },
      }),
    };
  }

  async findMine(penggunaId: string, limit: number): Promise<ProsesBisnisInAppNotification[]> {
    return this.prisma.notifikasiProsesBisnis.findMany({
      where: { penggunaId },
      select: {
        notifikasiProsesBisnisId: true,
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
    notifikasiProsesBisnisId: string,
  ): Promise<{ unreadCount: number }> {
    const updated = await this.prisma.notifikasiProsesBisnis.updateMany({
      where: { notifikasiProsesBisnisId, penggunaId },
      data: { readAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new NotFoundException('Notifikasi Proses Bisnis tidak ditemukan');
    }
    this.notificationEvents.emitChanged(penggunaId);
    return this.getSummary(penggunaId);
  }

  async markAllRead(penggunaId: string): Promise<{ unreadCount: number; updated: number }> {
    const result = await this.prisma.notifikasiProsesBisnis.updateMany({
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
    input: NotifikasiProsesBisnisCreateInput,
  ): Promise<void> {
    const message = this.buildMessage(input);
    await tx.notifikasiProsesBisnis.create({
      data: {
        detailSopId: input.detailSopId,
        sopId: input.sopId,
        prosesBisnisId: input.prosesBisnisId,
        penggunaId: input.penggunaId,
        kind: input.kind,
        ...message,
      },
    });
    await this.pengingatProsesBisnisService?.syncForNotificationInTransaction(tx, input);
  }

  async createManyInTransaction(
    tx: Prisma.TransactionClient,
    inputs: readonly NotifikasiProsesBisnisCreateInput[],
  ): Promise<string[]> {
    const seenRecipients = new Set<string>();
    const recipientIds: string[] = [];

    for (const input of inputs) {
      if (seenRecipients.has(input.penggunaId)) continue;
      seenRecipients.add(input.penggunaId);
      recipientIds.push(input.penggunaId);
      await this.createInTransaction(tx, input);
    }

    return recipientIds;
  }

  emitChanged(penggunaId: string): void {
    this.notificationEvents.emitChanged(penggunaId);
  }

  emitChangedMany(penggunaIds: readonly string[]): void {
    for (const penggunaId of new Set(penggunaIds)) {
      this.notificationEvents.emitChanged(penggunaId);
    }
  }

  private buildMessage(input: NotifikasiProsesBisnisCreateInput): {
    title: string;
    preview: string;
    body: string;
    actionHref: string;
  } {
    switch (input.kind) {
      case JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED:
        return {
          title: 'Review SOP Proses Bisnis diperlukan',
          preview: `SOP pada ProsesBisnis ${input.namaProsesBisnis} menunggu review Anda.`,
          body: `SOP ProsesBisnis ${input.namaProsesBisnis} telah disubmit dan menunggu keputusan ProsesBisnis Owner.`,
          actionHref: '/work/queue',
        };
      case JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED: {
        const authority = input.authorityLabel ?? 'kewenangan organisasi';
        return {
          title: 'Persetujuan akhir SOP diperlukan',
          preview: `SOP pada ProsesBisnis ${input.namaProsesBisnis} menunggu persetujuan akhir Anda.`,
          body: `SOP ProsesBisnis ${input.namaProsesBisnis} telah diterima ProsesBisnis Owner dan menunggu persetujuan ${authority}.`,
          actionHref: '/approval',
        };
      }
      case JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED: {
        const catatan = input.catatan?.trim() || undefined;
        const previewCatatan =
          catatan === undefined
            ? ''
            : ` Catatan: ${catatan.length > 140 ? `${catatan.slice(0, 137)}...` : catatan}`;
        const bodyCatatan = catatan === undefined ? '' : ` Catatan pemilik proses: ${catatan}`;
        return {
          title: 'Revisi SOP Proses Bisnis diperlukan',
          preview: truncatePreview(
            `SOP pada ProsesBisnis ${input.namaProsesBisnis} dikembalikan untuk revisi.${previewCatatan}`,
          ),
          body: `ProsesBisnis Owner meminta revisi SOP ProsesBisnis ${input.namaProsesBisnis}.${bodyCatatan} Buka antrean kerja untuk melanjutkan perbaikan.`,
          actionHref: '/work/queue',
        };
      }
      case JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE:
        return {
          title: 'SOP Proses Bisnis sudah berlaku',
          preview: `SOP pada ProsesBisnis ${input.namaProsesBisnis} sudah efektif dan dipublikasikan.`,
          body: `SOP ProsesBisnis ${input.namaProsesBisnis} telah selesai ditandatangani dan sekarang berstatus berlaku.`,
          actionHref: '/work/queue',
        };
      case JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED:
        return {
          title: 'SOP Proses Bisnis sudah dicabut',
          preview: `SOP pada ProsesBisnis ${input.namaProsesBisnis} sudah tidak berlaku.`,
          body: `SOP ProsesBisnis ${input.namaProsesBisnis} telah dicabut oleh kewenangan organisasi dan dipertahankan sebagai riwayat.`,
          actionHref: '/work/queue',
        };
    }
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) return 10;
    return Math.min(Math.max(Math.trunc(limit), 1), 50);
  }
}
