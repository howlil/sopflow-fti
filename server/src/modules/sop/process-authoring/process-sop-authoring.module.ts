import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ProcessModule } from '../../core/process/process.module';
import { ProcessNotificationModule } from '../../notifications/process/process-notification.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProcessBoundSopGuard } from './process-bound-sop.guard';
import { ProcessFinalApprovalController } from './process-final-approval.controller';
import { ProcessFinalApprovalService } from './process-final-approval.service';
import { ProcessOwnerReviewController } from './process-owner-review.controller';
import { ProcessOwnerReviewService } from './process-owner-review.service';
import { ProcessSopAuthoringController } from './process-sop-authoring.controller';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';
import { ProcessSopRevocationController } from './process-sop-revocation.controller';
import { ProcessSopRevocationService } from './process-sop-revocation.service';
import { ProcessVersionService } from './process-version.service';

@Module({
  imports: [ProcessModule, ProcessNotificationModule, SopWorkbenchModule, PelaksanaModule],
  controllers: [
    ProcessSopAuthoringController,
    ProcessOwnerReviewController,
    ProcessFinalApprovalController,
    ProcessSopRevocationController,
  ],
  providers: [
    ProcessSopAuthoringService,
    ProcessVersionService,
    ProcessOwnerReviewService,
    ProcessFinalApprovalService,
    ProcessSopRevocationService,
    { provide: APP_GUARD, useClass: ProcessBoundSopGuard },
  ],
  exports: [
    ProcessSopAuthoringService,
    ProcessVersionService,
    ProcessOwnerReviewService,
    ProcessFinalApprovalService,
    ProcessSopRevocationService,
  ],
})
export class ProcessSopAuthoringModule {}
