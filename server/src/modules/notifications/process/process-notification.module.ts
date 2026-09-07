import { Module } from '@nestjs/common';
import { NotifikasiProsesBisnisController } from './process-notification.controller';
import { NotifikasiProsesBisnisService } from './process-notification.service';
import { NotificationEventsModule } from '../shared/notification-events.module';
import { PengingatProsesBisnisService } from './process-reminder.service';

@Module({
  imports: [NotificationEventsModule],
  controllers: [NotifikasiProsesBisnisController],
  providers: [NotifikasiProsesBisnisService, PengingatProsesBisnisService],
  exports: [NotifikasiProsesBisnisService, PengingatProsesBisnisService],
})
export class NotifikasiProsesBisnisModule {}
