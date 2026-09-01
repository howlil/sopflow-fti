import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
  controllers: [InAppNotificationController],
  providers: [
    NotificationEventsService,
    ReminderMessageFactory,
    NotificationRecipientResolverService,
    NotificationReminderRepository,
    NotificationReminderReconcilerService,
    InAppNotificationService,
    NotificationReminderSchedulerService,
  ],
})
export class NotificationModule {}
