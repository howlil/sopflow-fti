/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotificationReminderReconcilerService } from './notification-reminder-reconciler.service';
import { NotificationReminderSchedulerService } from './notification-reminder-scheduler.service';

function build(inAppEnabled: boolean) {
  const schedulerRegistry = {
    addInterval: jest.fn(),
    doesExist: jest.fn().mockReturnValue(true),
    deleteInterval: jest.fn(),
  } as unknown as SchedulerRegistry;
  const reconciler = {
    reconcile: jest.fn().mockResolvedValue({ desired: 0, deleted: 0 }),
  } as unknown as NotificationReminderReconcilerService;
  const config = {
    get: jest.fn((key: string, fallback: unknown) => {
      if (key === 'NOTIFICATION_IN_APP_ENABLED') return inAppEnabled;
      if (key === 'NOTIFICATION_RECONCILE_INTERVAL_SECONDS') return 10;
      return fallback;
    }),
  } as unknown as ConfigService;
  return {
    schedulerRegistry,
    reconciler,
    service: new NotificationReminderSchedulerService(schedulerRegistry, reconciler, config),
  };
}

describe('NotificationReminderSchedulerService', () => {
  afterEach(() => jest.useRealTimers());

  it('tidak membuat interval atau menjalankan pekerjaan ketika in-app nonaktif', async () => {
    const { service, schedulerRegistry, reconciler } = build(false);
    service.onModuleInit();
    await service.tick();
    expect(schedulerRegistry.addInterval).not.toHaveBeenCalled();
    expect(reconciler.reconcile).not.toHaveBeenCalled();
  });

  it('mendaftarkan interval, menjalankan tick awal, dan membersihkannya saat shutdown', () => {
    jest.useFakeTimers();
    const { service, schedulerRegistry } = build(true);
    const tick = jest.spyOn(service, 'tick').mockResolvedValue(undefined);
    service.onModuleInit();
    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      'notification-reminder-reconcile',
      expect.anything(),
    );
    expect(tick).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith(
      'notification-reminder-reconcile',
    );
  });

  it('mencegah siklus overlap ketika rekonsiliasi sebelumnya belum selesai', async () => {
    const { service, reconciler } = build(true);
    let finishReconcile: (() => void) | undefined;
    (reconciler.reconcile as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        finishReconcile = () => resolve({ desired: 0, deleted: 0 });
      }),
    );
    const first = service.tick();
    await service.tick();
    expect(reconciler.reconcile).toHaveBeenCalledTimes(1);
    finishReconcile?.();
    await first;
  });

  it('membuka kembali scheduler setelah satu siklus gagal', async () => {
    const { service, reconciler } = build(true);
    (reconciler.reconcile as jest.Mock)
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce({ desired: 0, deleted: 0 });
    await expect(service.tick()).resolves.toBeUndefined();
    await expect(service.tick()).resolves.toBeUndefined();
    expect(reconciler.reconcile).toHaveBeenCalledTimes(2);
  });
});
