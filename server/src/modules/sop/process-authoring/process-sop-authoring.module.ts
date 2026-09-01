import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ProcessModule } from '../../core/process/process.module';
import { NotificationModule } from '../../notifications/reminders/notification.module';
import { SopCatalogModule } from '../catalog/sop-catalog.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProcessBoundSopGuard } from './process-bound-sop.guard';
import { ProcessFinalApprovalController } from './process-final-approval.controller';
import { ProcessFinalApprovalService } from './process-final-approval.service';
import { ProcessOwnerReviewController } from './process-owner-review.controller';
import { ProcessOwnerReviewService } from './process-owner-review.service';
import { ProcessSopAuthoringController } from './process-sop-authoring.controller';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

@Module({
  imports: [ProcessModule, NotificationModule, SopCatalogModule, PelaksanaModule],
  controllers: [
    ProcessSopAuthoringController,
    ProcessOwnerReviewController,
    ProcessFinalApprovalController,
  ],
  providers: [
    ProcessSopAuthoringService,
    ProcessOwnerReviewService,
    ProcessFinalApprovalService,
    { provide: APP_GUARD, useClass: ProcessBoundSopGuard },
  ],
  exports: [ProcessSopAuthoringService, ProcessOwnerReviewService, ProcessFinalApprovalService],
})
export class ProcessSopAuthoringModule {}
