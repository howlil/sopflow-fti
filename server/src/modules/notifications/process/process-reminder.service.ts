import { Injectable } from '@nestjs/common';
import { Prisma, JenisNotifikasiProsesBisnis, JenisPengingatProsesBisnis } from '../../../generated/prisma';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { NotifikasiProsesBisnisCreateInput } from './process-notification.service';

const REMINDER_KIND_BY_NOTIFICATION: Readonly<
  Partial<Record<JenisNotifikasiProsesBisnis, JenisPengingatProsesBisnis>>
> = {
  [JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED]:
    JenisPengingatProsesBisnis.PROCESS_OWNER_REVIEW,
  [JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED]: JenisPengingatProsesBisnis.PROCESS_REVISION,
  [JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED]: JenisPengingatProsesBisnis.FINAL_APPROVAL,
};

/**
 * Owns mutable reminder state for the native ProsesBisnis workflow.
 *
 * NotifikasiProsesBisnis remains the event/read model. Every new actionable
 * ProsesBisnis event replaces the active reminder set for that SOP version, making
 * actor transitions idempotent without touching archived legacy reminder rows.
 */
@Injectable()
export class PengingatProsesBisnisService {
  constructor(private readonly prisma: PrismaService) {}

  async syncForNotificationInTransaction(
    tx: Prisma.TransactionClient,
    input: NotifikasiProsesBisnisCreateInput,
  ): Promise<void> {
    await tx.pengingatProsesBisnis.deleteMany({ where: { detailSopId: input.detailSopId } });

    const kind = REMINDER_KIND_BY_NOTIFICATION[input.kind];
    if (kind === undefined) return;

    const recipient = await tx.pengguna.findUnique({
      where: { penggunaId: input.penggunaId },
      select: { nohp: true },
    });
    if (recipient === null) return;

    await tx.pengingatProsesBisnis.create({
      data: {
        detailSopId: input.detailSopId,
        sopId: input.sopId,
        prosesBisnisId: input.prosesBisnisId,
        penggunaId: input.penggunaId,
        kind,
        destinationPhone: recipient.nohp,
        nextSendAt: new Date(),
      },
    });
  }

  async findDue(now: Date, take: number) {
    return this.prisma.pengingatProsesBisnis.findMany({
      where: {
        nextSendAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      orderBy: [{ nextSendAt: 'asc' }, { createdAt: 'asc' }],
      take: Math.min(Math.max(Math.trunc(take), 1), 100),
    });
  }
}
