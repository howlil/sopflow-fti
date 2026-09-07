import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';

/**
 * Compatibility guard for legacy `/sop/:id...` endpoints.
 *
 * Once an SOP is owned by a ProsesBisnis, a legacy route must not bypass ProsesBisnis authorization with
 * retired global workflow-role compatibility. ProsesBisnis keanggotaan/ownership is the only
 * authoring authority for ProsesBisnis-bound SOPs. Unbound historical SOPs remain on
 * their explicit legacy compatibility path until their retention contract is retired.
 */
@Injectable()
export class ProsesBisnisBoundSopGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly prisma: PrismaService,
    private readonly konteksProsesBisnisService: ProsesBisnisContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtAccessPayload; params: Record<string, string | undefined> }
    >();

    const isLegacySopPath = /(^|\/)sop(\/|$)/.test(request.path);
    const isPublicSopPath = /(^|\/)sop\/public(\/|$)/.test(request.path);
    if (!isLegacySopPath || isPublicSopPath) return true;

    const candidateId =
      request.params.detailSopId ?? request.params.detailOrSopId ?? request.params.id;
    if (!candidateId) return true;

    // This guard is global and therefore runs before controller-scoped JWT guards.
    // Authenticate only the narrow legacy SOP paths that carry an SOP/detail id.
    const authenticated = await this.jwtAuthGuard.canActivate(context);
    if (!authenticated) return false;

    const user = request.user;
    if (!user) return false;

    const directSop = await this.prisma.sOP.findUnique({
      where: { sopId: candidateId },
      select: { sopId: true },
    });
    const directDetail =
      directSop === null
        ? await this.prisma.detailSOP.findUnique({
            where: { detailSopId: candidateId },
            select: { sopId: true },
          })
        : null;
    const sopId = directSop?.sopId ?? directDetail?.sopId;
    if (!sopId) return true;

    const sop = await this.prisma.sOP.findUnique({
      where: { sopId },
      select: { prosesBisnisId: true },
    });
    if (sop?.prosesBisnisId === null || sop === null) return true;

    await this.konteksProsesBisnisService.assertCanAuthor(user.sub, sop.prosesBisnisId);
    return true;
  }
}
