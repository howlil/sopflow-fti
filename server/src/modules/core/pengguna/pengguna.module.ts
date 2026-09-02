import { Module } from '@nestjs/common';
import { PlatformAccountController } from './platform-account.controller';
import { PlatformAccountService } from './platform-account.service';
import { PenggunaRepository } from './pengguna.repository';

@Module({
  controllers: [PlatformAccountController],
  providers: [PenggunaRepository, PlatformAccountService],
  exports: [PenggunaRepository, PlatformAccountService],
})
export class PenggunaModule {}
