/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { JenisPengingatWhatsApp as NotificationReminderKind } from '../../../generated/prisma';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationEventsService } from './notification-events.service';
import { ReminderMessageFactory } from './reminder-message.factory';
import { NotificationReminderRepository } from './notification-reminder.repository';

describe('InAppNotificationService', () => {
  it('membangun daftar notifikasi in-app dari histori persisten', async () => {
    const repository = {
      findInAppNotifications: jest.fn().mockResolvedValue([
        {
          pengajuanEvaluasiId: 'pengajuan-1',
          penggunaId: 'user-1',
          kind: NotificationReminderKind.EVALUASI_SOP,
          readAt: null,
          createdAt: new Date('2026-03-20T10:00:00.000Z'),
          pengajuanEvaluasi: {
            pengajuanEvaluasiId: 'pengajuan-1',
            opdId: 'opd-1',
            opdNama: 'OPD Test',
            nomorBA: null,
            status: 'SEDANG_DIEVALUASI',
            jumlahSop: 2,
          },
          pengguna: {
            penggunaId: 'user-1',
            opdId: 'opd-1',
            email: 'user@example.test',
            nama: 'User Test',
            peran: 'EVALUATOR',
            nohp: '628123456789',
            deletedAt: null,
          },
        },
      ]),
    } as unknown as NotificationReminderRepository;
    const messages = {
      build: jest.fn().mockReturnValue({
        title: 'Judul',
        preview: 'Preview',
        body: 'Isi',
      }),
    } as unknown as ReminderMessageFactory;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new InAppNotificationService(repository, messages, events);

    await expect(service.findMine('user-1', 10)).resolves.toEqual([
      {
        pengajuanEvaluasiId: 'pengajuan-1',
        jenis: NotificationReminderKind.EVALUASI_SOP,
        title: 'Judul',
        preview: 'Preview',
        body: 'Isi',
        readAt: null,
        createdAt: new Date('2026-03-20T10:00:00.000Z'),
      },
    ]);
  });

  it('menandai satu notifikasi dibaca berdasarkan natural key dan mengirim event perubahan', async () => {
    const repository = {
      markInAppRead: jest.fn().mockResolvedValue(true),
      countUnreadInApp: jest.fn().mockResolvedValue(2),
    } as unknown as NotificationReminderRepository;
    const messages = {} as ReminderMessageFactory;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new InAppNotificationService(repository, messages, events);

    await expect(
      service.markRead(
        'user-1',
        'pengajuan-1',
        NotificationReminderKind.TTD_BA_PJ_PENYUSUN,
      ),
    ).resolves.toEqual({ unreadCount: 2 });
    expect(repository.markInAppRead).toHaveBeenCalledWith(
      'user-1',
      'pengajuan-1',
      NotificationReminderKind.TTD_BA_PJ_PENYUSUN,
      expect.any(Date),
    );
    expect(events.emitChanged).toHaveBeenCalledWith('user-1');
  });

  it('mengembalikan NotFound ketika natural key notifikasi bukan milik pengguna', async () => {
    const repository = {
      markInAppRead: jest.fn().mockResolvedValue(false),
    } as unknown as NotificationReminderRepository;
    const messages = {} as ReminderMessageFactory;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new InAppNotificationService(repository, messages, events);

    await expect(
      service.markRead('user-1', 'pengajuan-1', NotificationReminderKind.EVALUASI_SOP),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(events.emitChanged).not.toHaveBeenCalled();
  });

  it('menandai semua notifikasi dibaca dan mengirim event hanya saat ada perubahan', async () => {
    const repository = {
      markAllInAppRead: jest.fn().mockResolvedValue(3),
      countUnreadInApp: jest.fn().mockResolvedValue(0),
    } as unknown as NotificationReminderRepository;
    const messages = {} as ReminderMessageFactory;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new InAppNotificationService(repository, messages, events);

    await expect(service.markAllRead('user-1')).resolves.toEqual({ unreadCount: 0, updated: 3 });
    expect(events.emitChanged).toHaveBeenCalledWith('user-1');
  });
});
