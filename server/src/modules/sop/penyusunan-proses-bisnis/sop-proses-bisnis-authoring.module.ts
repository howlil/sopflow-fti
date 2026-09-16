import { Module } from '@nestjs/common';
import { ProsesBisnisModule } from '../../core/proses-bisnis/proses-bisnis.module';
import { NotifikasiProsesBisnisModule } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { ProsesBisnisSopLifecycleController } from './siklus-sop-proses-bisnis.controller';
import { ProsesBisnisSopLifecycleService } from './siklus-sop-proses-bisnis.service';
import { ProsesBisnisOwnerReviewController } from './pemeriksaan-penanggung-jawab-proses-bisnis.controller';
import { ProsesBisnisOwnerReviewService } from './pemeriksaan-penanggung-jawab-proses-bisnis.service';
import { ProsesBisnisSopAuthoringController } from './sop-proses-bisnis-authoring.controller';
import { ProsesBisnisSopAuthoringService } from './sop-proses-bisnis-authoring.service';
import { ProsesBisnisSopRevocationController } from './pencabutan-sop-proses-bisnis.controller';
import { ProsesBisnisSopRevocationService } from './pencabutan-sop-proses-bisnis.service';
import { ProsesBisnisVersionService } from './versi-sop-proses-bisnis.service';

@Module({
  imports: [ProsesBisnisModule, NotifikasiProsesBisnisModule, SopWorkbenchModule, PelaksanaModule],
  controllers: [
    ProsesBisnisSopAuthoringController,
    ProsesBisnisOwnerReviewController,
    ProsesBisnisSopLifecycleController,
    ProsesBisnisSopRevocationController,
  ],
  providers: [
    ProsesBisnisSopAuthoringService,
    ProsesBisnisVersionService,
    ProsesBisnisOwnerReviewService,
    ProsesBisnisSopLifecycleService,
    ProsesBisnisSopRevocationService,
  ],
})
export class ProsesBisnisSopAuthoringModule {}
