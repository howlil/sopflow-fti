import { Injectable } from '@nestjs/common';
import { Prisma, ProcessNotificationKind, ProcessReminderKind } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProcessNotificationCreateInput } from './process-notification.service';

const REMINDER_KIND_BY_NOTIFICATION: Readonly<
  Partial<Record<ProcessNotificationKind, ProcessReminderKind>>
> = {
  [ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED]:
    ProcessReminderKind.PROCESS_OWNER_REVIEW,
  [ProcessNotificationKind.PROCESS_REVISION_REQUESTED]: ProcessReminderKind.PROCESS_REVISION,
  [ProcessNotificationKind.FINAL_APPROVAL_REQUESTED]: ProcessReminderKind.FINAL_APPROVAL,
};

/**
 * Owns mutable reminder state for the native Process workflow.
 *
 * ProcessNotification remains the event/read model. Every new actionable
 * Process event replaces the active reminder set for that SOP version, making
 * actor transitions idempotent without touching archived legacy reminder rows.
 */
@Injectable()
export class ProcessReminderService {
  constructor(private readonly prisma: PrismaService) {}

  async syncForNotificationInTransaction(
    tx: Prisma.TransactionClient,
    input: ProcessNotificationCreateInput,
  ): Promise<void> {
    await tx.processReminder.deleteMany({ where: { detailSopId: input.detailSopId } });

    const kind = REMINDER_KIND_BY_NOTIFICATION[input.kind];
    if (kind === undefined) return;

    const recipient = await tx.pengguna.findUnique({
      where: { penggunaId: input.penggunaId },
      select: { nohp: true },
    });
    if (recipient === null) return;

    await tx.processReminder.create({
      data: {
        detailSopId: input.detailSopId,
        sopId: input.sopId,
        processId: input.processId,
        penggunaId: input.penggunaId,
        kind,
        destinationPhone: recipient.nohp,
        nextSendAt: new Date(),
      },
    });
  }

  async findDue(now: Date, take: number) {
    return this.prisma.processReminder.findMany({
      where: {
        nextSendAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      orderBy: [{ nextSendAt: 'asc' }, { createdAt: 'asc' }],
      take: Math.min(Math.max(Math.trunc(take), 1), 100),
    });
  }
}
