import { ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { PeranPengguna } from '../../../generated/prisma';
import { UserOpdAccessService } from '../../core/opd/user-opd-access.service';

export interface LegacySopAccessContext {
  processId: string | null;
  sopOpdId: string | null;
}

/**
 * Compatibility boundary for OPD-scoped catalog behavior.
 * Native Process workflows must not use this policy for authorization.
 */
@Injectable()
export class SopLegacyAccessPolicy {
  constructor(private readonly userOpdAccessService: UserOpdAccessService) {}

  isEvaluatorRole(role: PeranPengguna): boolean {
    return this.userOpdAccessService.isEvaluatorRole(role);
  }

  getLegacyRole(penggunaId: string): Promise<PeranPengguna> {
    return this.userOpdAccessService.getLegacyRole(penggunaId);
  }

  getRequiredUserOpdId(penggunaId: string): Promise<string> {
    return this.userOpdAccessService.getRequiredUserOpdId(penggunaId);
  }

  assertWorkbenchAccess(user: JwtAccessPayload, sopOpdId: string): Promise<void> {
    return this.userOpdAccessService.assertWorkbenchAccess(user, sopOpdId);
  }

  async assertLegacyContextAccess(
    user: JwtAccessPayload,
    context: LegacySopAccessContext,
  ): Promise<void> {
    if (context.processId !== null) {
      throw new ForbiddenException('SOP native harus diakses melalui Process workspace');
    }
    if (context.sopOpdId === null) {
      throw new ForbiddenException('SOP legacy tidak memiliki OPD compatibility context');
    }
    await this.assertWorkbenchAccess(user, context.sopOpdId);
  }
}
