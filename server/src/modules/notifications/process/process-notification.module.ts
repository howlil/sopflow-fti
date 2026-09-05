import { Module } from '@nestjs/common';
import { ProcessNotificationController } from './process-notification.controller';
import { ProcessNotificationService } from './process-notification.service';
import { NotificationEventsModule } from '../shared/notification-events.module';
import { ProcessReminderService } from './process-reminder.service';

@Module({
  imports: [NotificationEventsModule],
  controllers: [ProcessNotificationController],
  providers: [ProcessNotificationService, ProcessReminderService],
  exports: [ProcessNotificationService, ProcessReminderService],
})
export class ProcessNotificationModule {}
