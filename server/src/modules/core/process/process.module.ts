import { Module } from '@nestjs/common';
import { OrganizationalAuthorityController } from './organizational-authority.controller';
import { OrganizationalAuthorityService } from './organizational-authority.service';
import { ProcessContextController } from './process-context.controller';
import { ProcessContextService } from './process-context.service';
import { ProcessController } from './process.controller';
import { ProcessRepository } from './process.repository';
import { ProcessService } from './process.service';

@Module({
  controllers: [ProcessController, ProcessContextController, OrganizationalAuthorityController],
  providers: [
    ProcessRepository,
    ProcessService,
    ProcessContextService,
    OrganizationalAuthorityService,
  ],
  exports: [
    ProcessRepository,
    ProcessService,
    ProcessContextService,
    OrganizationalAuthorityService,
  ],
})
export class ProcessModule {}
