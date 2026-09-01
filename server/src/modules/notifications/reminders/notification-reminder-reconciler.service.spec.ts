/* eslint-disable @typescript-eslint/unbound-method */
import { JenisPengingatWhatsApp as NotificationReminderKind } from '../../../generated/prisma';
import { NotificationEventsService } from './notification-events.service';
import { NotificationRecipientResolverService } from './notification-recipient-resolver.service';
import { NotificationReminderReconcilerService } from './notification-reminder-reconciler.service';
import { NotificationReminderRepository } from './notification-reminder.repository';

describe('NotificationReminderReconcilerService', () => {
  it('membuat histori in-app dan menghapus hanya state reminder WhatsApp yang stale', async () => {
    const desired = {
      pengajuanEvaluasiId: 'p-1',
      penggunaId: 'u-1',
      kind: NotificationReminderKind.EVALUASI_SOP,
      destination: '628123456789',
    };
    const repository = {
      findActionablePengajuan: jest.fn().mockResolvedValue([{ pengajuanEvaluasiId: 'p-1' }]),
      findActiveRecipients: jest.fn().mockResolvedValue([{ penggunaId: 'u-1' }]),
      findExistingReminders: jest.fn().mockResolvedValue([
        { notificationReminderId: 'keep', ...desired },
        {
          notificationReminderId: 'stale',
          pengajuanEvaluasiId: 'p-old',
          penggunaId: 'u-1',
          kind: NotificationReminderKind.EVALUASI_SOP,
        },
      ]),
      upsertDesiredReminder: jest.fn().mockResolvedValue(undefined),
      createInAppNotificationIfMissing: jest.fn().mockResolvedValue(true),
      deleteReminderIds: jest.fn().mockResolvedValue(1),
    } as unknown as NotificationReminderRepository;
    const resolver = {
      resolve: jest.fn().mockReturnValue([desired]),
    } as unknown as NotificationRecipientResolverService;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new NotificationReminderReconcilerService(repository, resolver, events);
    const now = new Date('2026-08-13T00:00:00.000Z');

    await expect(service.reconcile(now)).resolves.toEqual({ desired: 1, deleted: 1 });
    expect(repository.upsertDesiredReminder).toHaveBeenCalledWith(desired, now);
    expect(repository.createInAppNotificationIfMissing).toHaveBeenCalledWith(desired, now);
    expect(repository.deleteReminderIds).toHaveBeenCalledWith(['stale']);
    expect(events.emitChanged).toHaveBeenCalledTimes(1);
    expect(events.emitChanged).toHaveBeenCalledWith('u-1');
  });

  it('tidak mengirim event in-app hanya karena reminder WhatsApp stale dibersihkan', async () => {
    const repository = {
      findActionablePengajuan: jest.fn().mockResolvedValue([]),
      findActiveRecipients: jest.fn().mockResolvedValue([]),
      findExistingReminders: jest.fn().mockResolvedValue([
        {
          notificationReminderId: 'stale',
          pengajuanEvaluasiId: 'p-1',
          penggunaId: 'u-1',
          kind: NotificationReminderKind.EVALUASI_SOP,
        },
      ]),
      upsertDesiredReminder: jest.fn(),
      createInAppNotificationIfMissing: jest.fn(),
      deleteReminderIds: jest.fn().mockResolvedValue(1),
    } as unknown as NotificationReminderRepository;
    const resolver = { resolve: jest.fn() } as unknown as NotificationRecipientResolverService;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new NotificationReminderReconcilerService(repository, resolver, events);

    await service.reconcile();

    expect(repository.deleteReminderIds).toHaveBeenCalledWith(['stale']);
    expect(repository.upsertDesiredReminder).not.toHaveBeenCalled();
    expect(repository.createInAppNotificationIfMissing).not.toHaveBeenCalled();
    expect(events.emitChanged).not.toHaveBeenCalled();
  });

  it('tidak mengirim event ketika reconcile tidak membuat histori baru', async () => {
    const desired = {
      pengajuanEvaluasiId: 'p-1',
      penggunaId: 'u-1',
      kind: NotificationReminderKind.EVALUASI_SOP,
      destination: '628123456789',
    };
    const repository = {
      findActionablePengajuan: jest.fn().mockResolvedValue([{ pengajuanEvaluasiId: 'p-1' }]),
      findActiveRecipients: jest.fn().mockResolvedValue([{ penggunaId: 'u-1' }]),
      findExistingReminders: jest
        .fn()
        .mockResolvedValue([{ notificationReminderId: 'keep', ...desired }]),
      upsertDesiredReminder: jest.fn().mockResolvedValue(undefined),
      createInAppNotificationIfMissing: jest.fn().mockResolvedValue(false),
      deleteReminderIds: jest.fn().mockResolvedValue(0),
    } as unknown as NotificationReminderRepository;
    const resolver = {
      resolve: jest.fn().mockReturnValue([desired]),
    } as unknown as NotificationRecipientResolverService;
    const events = { emitChanged: jest.fn() } as unknown as NotificationEventsService;
    const service = new NotificationReminderReconcilerService(repository, resolver, events);

    await service.reconcile(new Date('2026-08-13T00:00:00.000Z'));

    expect(repository.createInAppNotificationIfMissing).toHaveBeenCalledTimes(1);
    expect(events.emitChanged).not.toHaveBeenCalled();
  });
});
