import { Module } from '@nestjs/common';
import { OrganizationalAuthorityController } from './organizational-authority.controller';
import { OrganizationalAuthorityService } from './organizational-authority.service';
import { ProcessContextController } from './process-context.controller';
import { ProcessContextService } from './process-context.service';
import { ProcessController } from './process.controller';
import { ProcessInvitationController } from './process-invitation.controller';
import { ProcessOwnerAuthorityController } from './process-owner-authority.controller';
import { ProcessOwnerAuthorityService } from './process-owner-authority.service';
import { ProcessOwnerController } from './process-owner.controller';
import { ProcessOwnerService } from './process-owner.service';
import { ProcessRepository } from './process.repository';
import { ProcessService } from './process.service';

@Module({
  controllers: [
    ProcessController,
    ProcessContextController,
    OrganizationalAuthorityController,
    ProcessOwnerAuthorityController,
    ProcessOwnerController,
    ProcessInvitationController,
  ],
  providers: [
    ProcessRepository,
    ProcessService,
    ProcessContextService,
    OrganizationalAuthorityService,
    ProcessOwnerAuthorityService,
    ProcessOwnerService,
  ],
  exports: [
    ProcessRepository,
    ProcessService,
    ProcessContextService,
    OrganizationalAuthorityService,
    ProcessOwnerAuthorityService,
    ProcessOwnerService,
  ],
})
export class ProcessModule {}
