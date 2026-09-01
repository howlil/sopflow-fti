import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotificationReminderReconcilerService } from './notification-reminder-reconciler.service';

const SCHEDULER_NAME = 'notification-reminder-reconcile';

@Injectable()
export class NotificationReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationReminderSchedulerService.name);
  private readonly inAppEnabled: boolean;
  private readonly intervalMs: number;
  private running = false;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly reconciler: NotificationReminderReconcilerService,
    config: ConfigService,
  ) {
    this.inAppEnabled = config.get<boolean>('NOTIFICATION_IN_APP_ENABLED', true);
    this.intervalMs = config.get<number>('NOTIFICATION_RECONCILE_INTERVAL_SECONDS', 10) * 1_000;
  }

  onModuleInit(): void {
    if (!this.inAppEnabled) {
      this.logger.log('Notification reminder in-app dinonaktifkan');
      return;
    }

    const interval = setInterval(() => void this.tick(), this.intervalMs);
    this.schedulerRegistry.addInterval(SCHEDULER_NAME, interval);
    this.logger.log(`Notification reminder in-app aktif interval=${this.intervalMs}ms`);
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('interval', SCHEDULER_NAME)) {
      this.schedulerRegistry.deleteInterval(SCHEDULER_NAME);
    }
  }

  async tick(): Promise<void> {
    if (!this.inAppEnabled || this.running) {
      return;
    }
    this.running = true;
    try {
      await this.reconciler.reconcile();
    } catch (error) {
      this.logger.error(
        `Siklus notification reminder gagal: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.running = false;
    }
  }
}
