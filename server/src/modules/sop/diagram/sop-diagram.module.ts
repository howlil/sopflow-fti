import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { ProcessModule } from '../../core/process/process.module';
import { SopWorkbenchModule } from '../catalog/sop-workbench.module';
import { SopDiagramController } from './sop-diagram.controller';
import { SopDiagramRepository } from './sop-diagram.repository';
import { SopDiagramService } from './sop-diagram.service';

@Module({
  imports: [AuthModule, ProcessModule, SopWorkbenchModule],
  controllers: [SopDiagramController],
  providers: [SopDiagramService, SopDiagramRepository],
  exports: [SopDiagramRepository],
})
export class SopDiagramModule {}
