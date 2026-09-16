import { Module } from '@nestjs/common';
import { NotifikasiProsesBisnisController } from './notifikasi-proses-bisnis.controller';
import { NotifikasiProsesBisnisService } from './notifikasi-proses-bisnis.service';
import { NotificationEventsModule } from '../shared/notification-events.module';

@Module({
  imports: [NotificationEventsModule],
  controllers: [NotifikasiProsesBisnisController],
  providers: [NotifikasiProsesBisnisService],
  exports: [NotifikasiProsesBisnisService],
})
export class NotifikasiProsesBisnisModule {}
