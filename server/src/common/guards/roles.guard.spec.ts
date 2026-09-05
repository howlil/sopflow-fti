import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PrismaService } from '../prisma/prisma.service';
import { PeranPengguna } from '../../generated/prisma';
import type { JwtAccessPayload } from '../types/jwt-access-payload.type';
import { ROLES_METADATA_KEY, RolesGuard } from './roles.guard';

function buildContext(user: JwtAccessPayload | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('Pengujian RolesGuard compatibility', () => {
  const prisma = {
    pengguna: { findFirst: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function reflectorWith(roles: PeranPengguna[] | undefined): Reflector {
    return {
      getAllAndOverride: jest
        .fn()
        .mockImplementation((key: string) => (key === ROLES_METADATA_KEY ? roles : undefined)),
    } as unknown as Reflector;
  }

  it('mengizinkan ketika endpoint tidak memiliki metadata legacy role', async () => {
    const guard = new RolesGuard(reflectorWith(undefined), prisma);
    await expect(
      guard.canActivate(buildContext({ sub: 'u-1', email: 'u@fti.test' })),
    ).resolves.toBe(true);
    expect(prisma.pengguna.findFirst).not.toHaveBeenCalled();
  });

  it('mengizinkan metadata array kosong tanpa persistence lookup', async () => {
    const guard = new RolesGuard(reflectorWith([]), prisma);
    await expect(
      guard.canActivate(buildContext({ sub: 'u-1', email: 'u@fti.test' })),
    ).resolves.toBe(true);
    expect(prisma.pengguna.findFirst).not.toHaveBeenCalled();
  });

  it('mengambil legacy role dari persistence dan menghidrasinya hanya untuk request compatibility', async () => {
    (prisma.pengguna.findFirst as jest.Mock).mockResolvedValue({ peran: PeranPengguna.PJ_EVALUATOR });
    const user: JwtAccessPayload = { sub: 'u-1', email: 'u@fti.test' };
    const guard = new RolesGuard(reflectorWith([PeranPengguna.PJ_EVALUATOR]), prisma);

    await expect(guard.canActivate(buildContext(user))).resolves.toBe(true);
    expect(prisma.pengguna.findFirst).toHaveBeenCalledWith({
      where: { penggunaId: 'u-1', deletedAt: null },
      select: { peran: true },
    });
    expect(user.peran).toBe(PeranPengguna.PJ_EVALUATOR);
  });

  it('menolak ketika persistence role tidak termasuk daftar compatibility', async () => {
    (prisma.pengguna.findFirst as jest.Mock).mockResolvedValue({ peran: PeranPengguna.EVALUATOR });
    const guard = new RolesGuard(reflectorWith([PeranPengguna.PJ_EVALUATOR]), prisma);

    await expect(
      guard.canActivate(buildContext({ sub: 'u-1', email: 'u@fti.test' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('menolak metadata legacy role ketika pengguna belum terautentikasi', async () => {
    const guard = new RolesGuard(reflectorWith([PeranPengguna.PJ_EVALUATOR]), prisma);
    await expect(guard.canActivate(buildContext(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.pengguna.findFirst).not.toHaveBeenCalled();
  });
});