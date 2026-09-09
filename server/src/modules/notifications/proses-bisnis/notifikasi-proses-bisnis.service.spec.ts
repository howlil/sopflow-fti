import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { JenisNotifikasiProsesBisnis } from '../../../generated/prisma';
import type { NotificationEventsService } from '../shared/notification-events.service';
import { NotifikasiProsesBisnisService } from './notifikasi-proses-bisnis.service';

function makeService() {
  const prisma = {
    notifikasiProsesBisnis: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaService;
  const events = {
    emitChanged: jest.fn(),
  } as unknown as NotificationEventsService;
  return { service: new NotifikasiProsesBisnisService(prisma, events), prisma, events };
}

function makeTx() {
  return {
    notifikasiProsesBisnis: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('NotifikasiProsesBisnisService', () => {
  it('counts unread Proses Bisnis notifications for the current user', async () => {
    const { service, prisma } = makeService();

    await expect(service.getSummary('user-1')).resolves.toEqual({ unreadCount: 2 });
    expect(prisma.notifikasiProsesBisnis.count).toHaveBeenCalledWith({
      where: { penggunaId: 'user-1', readAt: null },
    });
  });

  it('creates Penanggung Jawab Proses Bisnis review notification content inside the workflow transaction', async () => {
    const { service } = makeService();
    const tx = makeTx();

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: 'prosesBisnis-1',
      penggunaId: 'owner-1',
      kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
      namaProsesBisnis: 'Akademik',
    });

    expect(tx.notifikasiProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        penggunaId: 'owner-1',
        kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
        title: 'Review SOP Proses Bisnis diperlukan',
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
      prosesBisnisId: 'prosesBisnis-1',
      penggunaId: 'dean-1',
      kind: JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED,
      namaProsesBisnis: 'Akademik',
      authorityLabel: 'Dean',
    });

    expect(tx.notifikasiProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        penggunaId: 'dean-1',
        kind: JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED,
        body: expect.stringContaining('Dean'),
        actionHref: '/persetujuan',
      }),
    });
  });

  it('includes the native Proses Bisnis revision note in durable author feedback', async () => {
    const { service } = makeService();
    const tx = makeTx();

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: 'prosesBisnis-1',
      penggunaId: 'author-1',
      kind: JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED,
      namaProsesBisnis: 'Akademik',
      catatan: 'Perbaiki langkah 2 dan lengkapi output dokumen.',
    });

    expect(tx.notifikasiProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        preview: expect.stringContaining('Perbaiki langkah 2'),
        body: expect.stringContaining('Perbaiki langkah 2 dan lengkapi output dokumen.'),
      }),
    });
  });

  it.each([
    [JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED, 'Revisi SOP Proses Bisnis diperlukan'],
    [JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE, 'SOP Proses Bisnis sudah berlaku'],
    [JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED, 'SOP Proses Bisnis sudah dicabut'],
  ])('maps %s to current FTI workflow feedback copy', async (kind, title) => {
    const { service } = makeService();
    const tx = makeTx();

    await service.createInTransaction(tx as never, {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: 'prosesBisnis-1',
      penggunaId: 'user-1',
      kind,
      namaProsesBisnis: 'Akademik',
    });

    expect(tx.notifikasiProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind,
        title,
        preview: expect.stringContaining('Akademik'),
        actionHref: '/work/queue',
      }),
    });
  });

  it('deduplicates multi-recipient feedback when author and Penanggung Jawab Proses Bisnis are the same account', async () => {
    const { service } = makeService();
    const tx = makeTx();
    const base = {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: 'prosesBisnis-1',
      penggunaId: 'owner-author-1',
      kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
      namaProsesBisnis: 'Akademik',
    } as const;

    await expect(service.createManyInTransaction(tx as never, [base, base])).resolves.toEqual([
      'owner-author-1',
    ]);
    expect(tx.notifikasiProsesBisnis.create).toHaveBeenCalledTimes(1);
  });

  it('emits one realtime refresh per unique feedback recipient', () => {
    const { service, events } = makeService();

    service.emitChangedMany(['user-1', 'user-2', 'user-1']);

    expect(events.emitChanged).toHaveBeenCalledTimes(2);
    expect(events.emitChanged).toHaveBeenCalledWith('user-1');
    expect(events.emitChanged).toHaveBeenCalledWith('user-2');
  });

  it('does not allow one user to mark another user Proses Bisnis notification as read', async () => {
    const { service, prisma, events } = makeService();
    jest.mocked(prisma.notifikasiProsesBisnis.updateMany).mockResolvedValue({ count: 0 });

    await expect(service.markRead('user-1', 'notification-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(events.emitChanged).not.toHaveBeenCalled();
  });
});
