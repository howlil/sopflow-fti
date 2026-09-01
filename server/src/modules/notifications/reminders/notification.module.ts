import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProcessNotificationController } from '../process/process-notification.controller';
import { ProcessNotificationService } from '../process/process-notification.service';
import { InAppNotificationController } from './in-app-notification.controller';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationEventsService } from './notification-events.service';
import { ReminderMessageFactory } from './reminder-message.factory';
import { NotificationRecipientResolverService } from './notification-recipient-resolver.service';
import { NotificationReminderReconcilerService } from './notification-reminder-reconciler.service';
import { NotificationReminderRepository } from './notification-reminder.repository';
import { NotificationReminderSchedulerService } from './notification-reminder-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [InAppNotificationController, ProcessNotificationController],
  providers: [
    NotificationEventsService,
    ReminderMessageFactory,
    NotificationRecipientResolverService,
    NotificationReminderRepository,
    NotificationReminderReconcilerService,
    InAppNotificationService,
    NotificationReminderSchedulerService,
    ProcessNotificationService,
  ],
  exports: [ProcessNotificationService],
})
export class NotificationModule {}
