import { Module } from '@nestjs/common';
import { SopPdfModule } from '../../sop/pdf/sop-pdf.module';
import { TteSharedModule } from '../shared/tte-shared.module';
import { ProcessTteController } from './process-tte.controller';
import { ProcessTteRepository } from './process-tte.repository';
import { ProcessTteService } from './process-tte.service';
import { TtePenandatangananService } from './tte-penandatanganan.service';
import { TtePdfSigningService } from './tte-pdf-signing.service';

@Module({
  imports: [TteSharedModule, SopPdfModule],
  controllers: [ProcessTteController],
  providers: [
    TtePenandatangananService,
    TtePdfSigningService,
    ProcessTteRepository,
    ProcessTteService,
  ],
  exports: [TtePenandatangananService, TtePdfSigningService, ProcessTteService],
})
export class TtePenandatangananModule {}
