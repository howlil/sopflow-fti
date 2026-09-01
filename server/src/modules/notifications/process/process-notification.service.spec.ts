import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessNotificationKind } from '../../../generated/prisma';
import type { NotificationEventsService } from '../reminders/notification-events.service';
import { ProcessNotificationService } from './process-notification.service';

function makeService() {
  const prisma = {
    processNotification: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaService;
  const events = {
    emitChanged: jest.fn(),
  } as unknown as NotificationEventsService;
  return { service: new ProcessNotificationService(prisma, events), prisma, events };
}

describe('ProcessNotificationService', () => {
  it('counts unread Process notifications independently from legacy notification history', async () => {
    const { service, prisma } = makeService();

    await expect(service.getSummary('user-1')).resolves.toEqual({ unreadCount: 2 });
    expect(prisma.processNotification.count).toHaveBeenCalledWith({
      where: { penggunaId: 'user-1', readAt: null },
    });
  });

  it('creates Process Owner review notification content inside the workflow transaction', async () => {
    const { service } = makeService();
    const tx = {
      processNotification: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      processId: 'process-1',
      penggunaId: 'owner-1',
      kind: ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED,
      processName: 'Akademik',
    });

    expect(tx.processNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        penggunaId: 'owner-1',
        kind: ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED,
        title: 'Review SOP Process diperlukan',
        actionHref: '/work/queue',
      }),
    });
  });

  it('creates final-approval notification content for the resolved authority', async () => {
    const { service } = makeService();
    const tx = {
      processNotification: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      processId: 'process-1',
      penggunaId: 'dean-1',
      kind: ProcessNotificationKind.FINAL_APPROVAL_REQUESTED,
      processName: 'Akademik',
      authorityLabel: 'Dean',
    });

    expect(tx.processNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        penggunaId: 'dean-1',
        kind: ProcessNotificationKind.FINAL_APPROVAL_REQUESTED,
        body: expect.stringContaining('Dean'),
        actionHref: '/approval',
      }),
    });
  });

  it('does not allow one user to mark another user Process notification as read', async () => {
    const { service, prisma, events } = makeService();
    jest.mocked(prisma.processNotification.updateMany).mockResolvedValue({ count: 0 });

    await expect(service.markRead('user-1', 'notification-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(events.emitChanged).not.toHaveBeenCalled();
  });
});
