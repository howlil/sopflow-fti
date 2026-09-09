import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { ProsesBisnisModule } from '../../core/proses-bisnis/proses-bisnis.module';
import { PelaksanaController } from './pelaksana.controller';
import { PelaksanaRepository } from './pelaksana.repository';
import { PelaksanaService } from './pelaksana.service';
import { PelaksanaSnapshotService } from './pelaksana-snapshot.service';

@Module({
  imports: [AuthModule, ProsesBisnisModule],
  controllers: [PelaksanaController],
  providers: [PelaksanaService, PelaksanaRepository, PelaksanaSnapshotService],
  exports: [PelaksanaSnapshotService],
})
export class PelaksanaModule {}
