import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ProcessModule } from '../../core/process/process.module';
import { SopCatalogModule } from '../catalog/sop-catalog.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProcessBoundSopGuard } from './process-bound-sop.guard';
import { ProcessOwnerReviewController } from './process-owner-review.controller';
import { ProcessOwnerReviewService } from './process-owner-review.service';
import { ProcessSopAuthoringController } from './process-sop-authoring.controller';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@Module({
  imports: [ProcessModule, SopCatalogModule, PelaksanaModule],
  controllers: [ProcessSopAuthoringController, ProcessOwnerReviewController],
  providers: [
    ProcessSopAuthoringService,
    ProcessOwnerReviewService,
    { provide: APP_GUARD, useClass: ProcessBoundSopGuard },
  ],
  exports: [ProcessSopAuthoringService, ProcessOwnerReviewService],
})
export class ProcessSopAuthoringModule {}
