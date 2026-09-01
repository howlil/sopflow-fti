import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { OpdModule } from '../../core/opd/opd.module';
import { ProcessModule } from '../../core/process/process.module';
import { SopCatalogModule } from '../catalog/sop-catalog.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { SopProsedurController } from './sop-prosedur.controller';
import { SopProsedurRepository } from './sop-prosedur.repository';
import { SopProsedurService } from './sop-prosedur.service';

@Module({
  imports: [AuthModule, OpdModule, ProcessModule, SopCatalogModule, PelaksanaModule],
  controllers: [SopProsedurController],
  providers: [SopProsedurService, SopProsedurRepository],
})
export class SopProsedurModule {}
