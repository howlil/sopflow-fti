import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ProsesBisnisModule } from '../../core/process/process.module';
import { NotifikasiProsesBisnisModule } from '../../notifications/process/process-notification.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProsesBisnisBoundSopGuard } from './process-bound-sop.guard';
import { PersetujuanAkhirSOPController } from './process-final-approval.controller';
import { PersetujuanAkhirSOPService } from './process-final-approval.service';
import { ProsesBisnisOwnerReviewController } from './process-owner-review.controller';
import { ProsesBisnisOwnerReviewService } from './process-owner-review.service';
import { ProsesBisnisSopAuthoringController } from './sop-proses-bisnis-authoring.controller';
import { ProsesBisnisSopAuthoringService } from './sop-proses-bisnis-authoring.service';
import { ProsesBisnisSopRevocationController } from './sop-proses-bisnis-revocation.controller';
import { ProsesBisnisSopRevocationService } from './sop-proses-bisnis-revocation.service';
import { ProsesBisnisVersionService } from './process-version.service';

@Module({
  imports: [ProsesBisnisModule, NotifikasiProsesBisnisModule, SopWorkbenchModule, PelaksanaModule],
  controllers: [
    ProsesBisnisSopAuthoringController,
    ProsesBisnisOwnerReviewController,
    PersetujuanAkhirSOPController,
    ProsesBisnisSopRevocationController,
  ],
  providers: [
    ProsesBisnisSopAuthoringService,
    ProsesBisnisVersionService,
    ProsesBisnisOwnerReviewService,
    PersetujuanAkhirSOPService,
    ProsesBisnisSopRevocationService,
    { provide: APP_GUARD, useClass: ProsesBisnisBoundSopGuard },
  ],
  exports: [
    ProsesBisnisSopAuthoringService,
    ProsesBisnisVersionService,
    ProsesBisnisOwnerReviewService,
    PersetujuanAkhirSOPService,
    ProsesBisnisSopRevocationService,
  ],
})
export class ProsesBisnisSopAuthoringModule {}
