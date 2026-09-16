import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProsesBisnisModule } from '../proses-bisnis/proses-bisnis.module';
import { PeraturanController } from './peraturan.controller';
import { PeraturanRepository } from './peraturan.repository';
import { PeraturanService } from './peraturan.service';

@Module({
  imports: [AuthModule, ProsesBisnisModule],
  controllers: [PeraturanController],
  providers: [PeraturanService, PeraturanRepository],
})
export class PeraturanModule {}
