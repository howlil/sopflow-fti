import { Module } from '@nestjs/common';
import { ProsesBisnisModule } from '../../core/proses-bisnis/proses-bisnis.module';
import { NotifikasiProsesBisnisModule } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { PersetujuanAkhirSOPController } from './persetujuan-akhir-sop.controller';
import { PersetujuanAkhirSOPService } from './persetujuan-akhir-sop.service';
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
    PersetujuanAkhirSOPController,
    ProsesBisnisSopRevocationController,
  ],
  providers: [
    ProsesBisnisSopAuthoringService,
    ProsesBisnisVersionService,
    ProsesBisnisOwnerReviewService,
    PersetujuanAkhirSOPService,
    ProsesBisnisSopRevocationService,
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
