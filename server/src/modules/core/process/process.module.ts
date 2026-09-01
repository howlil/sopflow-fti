import { Module } from '@nestjs/common';
import { ProcessController } from './process.controller';
import { ProcessRepository } from './process.repository';
import { ProcessService } from './process.service';

@Module({
  controllers: [ProcessController],
  providers: [ProcessRepository, ProcessService],
  exports: [ProcessRepository, ProcessService],
})
export class ProcessModule {}
