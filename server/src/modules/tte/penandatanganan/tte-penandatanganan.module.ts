import { Module } from '@nestjs/common';
import { NotifikasiProsesBisnisModule } from '../../notifications/process/process-notification.module';
import { SopPdfModule } from '../../sop/pdf/sop-pdf.module';
import { TteSharedModule } from '../shared/tte-shared.module';
import { ProsesBisnisTteController } from './tte-proses-bisnis.controller';
import { ProsesBisnisTteRepository } from './tte-proses-bisnis.repository';
import { ProsesBisnisTteService } from './tte-proses-bisnis.service';
import { TtePdfSigningService } from './tte-pdf-signing.service';

@Module({
  imports: [TteSharedModule, SopPdfModule, NotifikasiProsesBisnisModule],
  controllers: [ProsesBisnisTteController],
  providers: [
    TtePdfSigningService,
    ProsesBisnisTteRepository,
    ProsesBisnisTteService,
  ],
  exports: [TtePdfSigningService, ProsesBisnisTteService],
})
export class TtePenandatangananModule {}
