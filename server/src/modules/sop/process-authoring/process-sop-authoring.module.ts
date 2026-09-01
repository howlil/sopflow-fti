import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ProcessModule } from '../../core/process/process.module';
import { SopCatalogModule } from '../catalog/sop-catalog.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProcessBoundSopGuard } from './process-bound-sop.guard';
import { ProcessSopAuthoringController } from './process-sop-authoring.controller';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@Module({
  imports: [ProcessModule, SopCatalogModule, PelaksanaModule],
  controllers: [ProcessSopAuthoringController],
  providers: [
    ProcessSopAuthoringService,
    { provide: APP_GUARD, useClass: ProcessBoundSopGuard },
  ],
  exports: [ProcessSopAuthoringService],
})
export class ProcessSopAuthoringModule {}
