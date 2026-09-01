import { Module } from '@nestjs/common';
import { ProcessContextController } from './process-context.controller';
import { ProcessContextService } from './process-context.service';
import { ProcessController } from './process.controller';
import { ProcessRepository } from './process.repository';
import { ProcessService } from './process.service';

@Module({
  controllers: [ProcessController, ProcessContextController],
  providers: [ProcessRepository, ProcessService, ProcessContextService],
  exports: [ProcessRepository, ProcessService, ProcessContextService],
})
export class ProcessModule {}
