import { Module } from '@nestjs/common';
import { ProcessNotificationModule } from '../../notifications/process/process-notification.module';
import { SopPdfModule } from '../../sop/pdf/sop-pdf.module';
import { TteSharedModule } from '../shared/tte-shared.module';
import { ProcessTteController } from './process-tte.controller';
import { ProcessTteRepository } from './process-tte.repository';
import { ProcessTteService } from './process-tte.service';
import { TtePdfSigningService } from './tte-pdf-signing.service';

@Module({
  imports: [TteSharedModule, SopPdfModule, ProcessNotificationModule],
  controllers: [ProcessTteController],
  providers: [
    TtePdfSigningService,
    ProcessTteRepository,
    ProcessTteService,
  ],
  exports: [TtePdfSigningService, ProcessTteService],
})
export class TtePenandatangananModule {}
