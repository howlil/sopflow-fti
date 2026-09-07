import { Module } from '@nestjs/common';
import { PejabatBerwenangController } from './organizational-authority.controller';
import { PejabatBerwenangService } from './organizational-authority.service';
import { ProsesBisnisContextController } from './konteks-proses-bisnis.controller';
import { ProsesBisnisContextService } from './konteks-proses-bisnis.service';
import { ProsesBisnisController } from './process.controller';
import { UndanganAnggotaProsesBisnisController } from './process-invitation.controller';
import { KewenanganPenanggungJawabProsesBisnisController } from './process-owner-authority.controller';
import { KewenanganPenanggungJawabProsesBisnisService } from './process-owner-authority.service';
import { ProsesBisnisOwnerController } from './process-owner.controller';
import { ProsesBisnisOwnerService } from './process-owner.service';
import { ProsesBisnisRepository } from './process.repository';
import { ProsesBisnisService } from './process.service';

@Module({
  controllers: [
    ProsesBisnisController,
    ProsesBisnisContextController,
    PejabatBerwenangController,
    KewenanganPenanggungJawabProsesBisnisController,
    ProsesBisnisOwnerController,
    UndanganAnggotaProsesBisnisController,
  ],
  providers: [
    ProsesBisnisRepository,
    ProsesBisnisService,
    ProsesBisnisContextService,
    PejabatBerwenangService,
    KewenanganPenanggungJawabProsesBisnisService,
    ProsesBisnisOwnerService,
  ],
  exports: [
    ProsesBisnisRepository,
    ProsesBisnisService,
    ProsesBisnisContextService,
    PejabatBerwenangService,
    KewenanganPenanggungJawabProsesBisnisService,
    ProsesBisnisOwnerService,
  ],
})
export class ProsesBisnisModule {}
