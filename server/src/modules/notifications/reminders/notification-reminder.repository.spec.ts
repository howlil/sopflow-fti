/* eslint-disable @typescript-eslint/unbound-method */
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { JenisPengingatWhatsApp as NotificationReminderKind } from '../../../generated/prisma';
import { NotificationReminderRepository } from './notification-reminder.repository';

describe('NotificationReminderRepository in-app history', () => {
  const prismaMock = {
    notifikasiInApp: {
      createMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let repository: NotificationReminderRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new NotificationReminderRepository(prismaMock as unknown as PrismaService);
  });

  it('membuat histori dengan natural composite key secara idempotent', async () => {
    prismaMock.notifikasiInApp.createMany.mockResolvedValueOnce({ count: 1 });
    const now = new Date('2026-08-13T00:00:00.000Z');
    const reminder = {
      pengajuanEvaluasiId: 'pengajuan-1',
      penggunaId: 'user-1',
      kind: NotificationReminderKind.EVALUASI_SOP,
      destination: '628123456789',
    };

    await expect(repository.createInAppNotificationIfMissing(reminder, now)).resolves.toBe(true);
    expect(prismaMock.notifikasiInApp.createMany).toHaveBeenCalledWith({
      data: [
        {
          pengajuanEvaluasiId: 'pengajuan-1',
          penggunaId: 'user-1',
          jenis: NotificationReminderKind.EVALUASI_SOP,
          createdAt: now,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('melaporkan false ketika histori dengan natural key yang sama sudah ada', async () => {
    prismaMock.notifikasiInApp.createMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      repository.createInAppNotificationIfMissing(
        {
          pengajuanEvaluasiId: 'pengajuan-1',
          penggunaId: 'user-1',
          kind: NotificationReminderKind.EVALUASI_SOP,
          destination: '628123456789',
        },
        new Date('2026-08-13T00:00:00.000Z'),
      ),
    ).resolves.toBe(false);
  });

  it('menghitung unread dari tabel histori, bukan state reminder WhatsApp', async () => {
    prismaMock.notifikasiInApp.count.mockResolvedValueOnce(3);

    await expect(repository.countUnreadInApp('user-1')).resolves.toBe(3);
    expect(prismaMock.notifikasiInApp.count).toHaveBeenCalledWith({
      where: { penggunaId: 'user-1', readAt: null },
    });
  });

  it('menandai read menggunakan pengajuan, pengguna, dan jenis', async () => {
    prismaMock.notifikasiInApp.updateMany.mockResolvedValueOnce({ count: 1 });
    const readAt = new Date('2026-08-13T01:00:00.000Z');

    await expect(
      repository.markInAppRead(
        'user-1',
        'pengajuan-1',
        NotificationReminderKind.TTD_BA_PJ_PENYUSUN,
        readAt,
      ),
    ).resolves.toBe(true);
    expect(prismaMock.notifikasiInApp.updateMany).toHaveBeenCalledWith({
      where: {
        penggunaId: 'user-1',
        pengajuanEvaluasiId: 'pengajuan-1',
        jenis: NotificationReminderKind.TTD_BA_PJ_PENYUSUN,
      },
      data: { readAt },
    });
  });
});
