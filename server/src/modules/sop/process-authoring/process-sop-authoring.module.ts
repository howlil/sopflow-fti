import { Module } from '@nestjs/common';
import { ProcessModule } from '../../core/process/process.module';
import { SopCatalogModule } from '../catalog/sop-catalog.module';
import { ProcessSopAuthoringController } from './process-sop-authoring.controller';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@Module({
  imports: [ProcessModule, SopCatalogModule],
  controllers: [ProcessSopAuthoringController],
  providers: [ProcessSopAuthoringService],
  exports: [ProcessSopAuthoringService],
})
export class ProcessSopAuthoringModule {}
