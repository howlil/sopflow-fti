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

function makeTx() {
  return {
    processNotification: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
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
    const tx = makeTx();

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
    const tx = makeTx();

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

  it.each([
    [
      ProcessNotificationKind.PROCESS_REVISION_REQUESTED,
      'Revisi SOP Process diperlukan',
      'SOP pada Process Akademik dikembalikan untuk revisi.',
    ],
    [
      ProcessNotificationKind.PROCESS_SOP_EFFECTIVE,
      'SOP Process sudah berlaku',
      'SOP pada Process Akademik sudah efektif dan dipublikasikan.',
    ],
    [
      ProcessNotificationKind.PROCESS_SOP_REVOKED,
      'SOP Process sudah dicabut',
      'SOP pada Process Akademik sudah tidak berlaku.',
    ],
  ])('maps %s to target-native workflow feedback copy', async (kind, title, preview) => {
    const { service } = makeService();
    const tx = makeTx();

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      processId: 'process-1',
      penggunaId: 'user-1',
      kind,
      processName: 'Akademik',
    });

    expect(tx.processNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind,
        title,
        preview,
        actionHref: '/work/queue',
      }),
    });
  });

  it('deduplicates multi-recipient feedback when author and Process Owner are the same account', async () => {
    const { service } = makeService();
    const tx = makeTx();
    const base = {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      processId: 'process-1',
      penggunaId: 'owner-author-1',
      kind: ProcessNotificationKind.PROCESS_SOP_EFFECTIVE,
      processName: 'Akademik',
    } as const;

    await expect(service.createManyInTransaction(tx as never, [base, base])).resolves.toEqual([
      'owner-author-1',
    ]);
    expect(tx.processNotification.create).toHaveBeenCalledTimes(1);
  });

  it('emits one realtime refresh per unique feedback recipient', () => {
    const { service, events } = makeService();

    service.emitChangedMany(['user-1', 'user-2', 'user-1']);

    expect(events.emitChanged).toHaveBeenCalledTimes(2);
    expect(events.emitChanged).toHaveBeenCalledWith('user-1');
    expect(events.emitChanged).toHaveBeenCalledWith('user-2');
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
