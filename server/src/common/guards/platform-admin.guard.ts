import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformRole } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtAccessPayload } from '../types/jwt-access-payload.type';

/**
 * Boundary administrasi platform. Sengaja terpisah dari RolesGuard karena
 * SUPER_ADMIN bukan peran workflow dan tidak boleh menjadi bypass global.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtAccessPayload }>();
    const penggunaId = request.user?.sub;
    if (!penggunaId) {
      throw new ForbiddenException('Akses administrasi platform diperlukan');
    }

    const user = await this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: { platformRole: true },
    });

    if (user?.platformRole !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Akses administrasi platform diperlukan');
    }

    return true;
  }
}
