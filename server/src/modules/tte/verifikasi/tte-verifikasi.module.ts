import { Module } from '@nestjs/common';
import { TteSharedModule } from '../shared/tte-shared.module';
import { ProsesBisnisTteVerificationRepository } from './tte-proses-bisnis-verification.repository';
import { TteVerifikasiService } from './tte-verifikasi.service';

@Module({
  imports: [TteSharedModule],
  providers: [TteVerifikasiService, ProsesBisnisTteVerificationRepository],
  exports: [TteVerifikasiService],
})
export class TteVerifikasiModule {}
