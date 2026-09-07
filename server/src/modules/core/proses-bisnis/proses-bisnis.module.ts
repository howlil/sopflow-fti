import { Module } from '@nestjs/common';
import { PejabatBerwenangController } from './pejabat-berwenang.controller';
import { PejabatBerwenangService } from './pejabat-berwenang.service';
import { ProsesBisnisContextController } from './konteks-proses-bisnis.controller';
import { ProsesBisnisContextService } from './konteks-proses-bisnis.service';
import { ProsesBisnisController } from './proses-bisnis.controller';
import { UndanganAnggotaProsesBisnisController } from './undangan-anggota-proses-bisnis.controller';
import { KewenanganPenanggungJawabProsesBisnisController } from './kewenangan-penanggung-jawab-proses-bisnis.controller';
import { KewenanganPenanggungJawabProsesBisnisService } from './kewenangan-penanggung-jawab-proses-bisnis.service';
import { PenanggungJawabProsesBisnisController } from './penanggung-jawab-proses-bisnis.controller';
import { PenanggungJawabProsesBisnisService } from './penanggung-jawab-proses-bisnis.service';
import { ProsesBisnisRepository } from './proses-bisnis.repository';
import { ProsesBisnisService } from './proses-bisnis.service';

@Module({
  controllers: [
    ProsesBisnisController,
    ProsesBisnisContextController,
    PejabatBerwenangController,
    KewenanganPenanggungJawabProsesBisnisController,
    PenanggungJawabProsesBisnisController,
    UndanganAnggotaProsesBisnisController,
  ],
  providers: [
    ProsesBisnisRepository,
    ProsesBisnisService,
    ProsesBisnisContextService,
    PejabatBerwenangService,
    KewenanganPenanggungJawabProsesBisnisService,
    PenanggungJawabProsesBisnisService,
  ],
  exports: [
    ProsesBisnisRepository,
    ProsesBisnisService,
    ProsesBisnisContextService,
    PejabatBerwenangService,
    KewenanganPenanggungJawabProsesBisnisService,
    PenanggungJawabProsesBisnisService,
  ],
})
export class ProsesBisnisModule {}
