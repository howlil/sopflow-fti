import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { PeranPengguna } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtAccessPayload } from '../types/jwt-access-payload.type';

/** Kunci metadata decorator `@Roles()` — hanya untuk endpoint compatibility legacy. */
export const ROLES_METADATA_KEY = 'peran_diizinkan';

/**
 * Compatibility guard untuk endpoint legacy yang belum dipensiunkan.
 *
 * Legacy role tidak lagi menjadi bagian dari first-party JWT. Endpoint yang masih
 * memakai `@Roles(...)` membaca compatibility role dari persistence secara lokal.
 * Native FTI workflow tidak boleh memakai guard ini; gunakan Process relationship,
 * Organizational Authority, atau PlatformAdminGuard sesuai boundary masing-masing.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = this.reflector.getAllAndOverride<PeranPengguna[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed === undefined || allowed.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request & { user?: JwtAccessPayload }>();
    const user = req.user;
    if (user === undefined) {
      throw new ForbiddenException('Autentikasi diperlukan untuk mengakses sumber ini');
    }
    const legacyIdentity = await this.prisma.pengguna.findFirst({
      where: { penggunaId: user.sub, deletedAt: null },
      select: { peran: true },
    });
    if (legacyIdentity === null || !allowed.includes(legacyIdentity.peran)) {
      throw new ForbiddenException('Peran compatibility Anda tidak memiliki akses ke operasi ini');
    }
    return true;
  }
}
