import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { ProcessModule } from '../../core/process/process.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { PelaksanaModule } from '../pelaksana/pelaksana.module';
import { SopProsedurController } from './sop-prosedur.controller';
import { SopProsedurRepository } from './sop-prosedur.repository';
import { SopProsedurService } from './sop-prosedur.service';

@Module({
  imports: [AuthModule, ProcessModule, SopWorkbenchModule, PelaksanaModule],
  controllers: [SopProsedurController],
  providers: [SopProsedurService, SopProsedurRepository],
})
export class SopProsedurModule {}
