import { Module } from '@nestjs/common';
import { NotifikasiProsesBisnisController } from './notifikasi-proses-bisnis.controller';
import { NotifikasiProsesBisnisService } from './notifikasi-proses-bisnis.service';
import { NotificationEventsModule } from '../shared/notification-events.module';
import { PengingatProsesBisnisService } from './pengingat-proses-bisnis.service';

@Module({
  imports: [NotificationEventsModule],
  controllers: [NotifikasiProsesBisnisController],
  providers: [NotifikasiProsesBisnisService, PengingatProsesBisnisService],
  exports: [NotifikasiProsesBisnisService, PengingatProsesBisnisService],
})
export class NotifikasiProsesBisnisModule {}
