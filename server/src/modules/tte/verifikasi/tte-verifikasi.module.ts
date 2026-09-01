import { Module } from '@nestjs/common';
import { TteSharedModule } from '../shared/tte-shared.module';
import { ProcessTteVerificationRepository } from './process-tte-verification.repository';
import { TteVerifikasiService } from './tte-verifikasi.service';

@Module({
  imports: [TteSharedModule],
  providers: [TteVerifikasiService, ProcessTteVerificationRepository],
  exports: [TteVerifikasiService],
})
export class TteVerifikasiModule {}
