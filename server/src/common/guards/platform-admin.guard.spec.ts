import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlatformRole } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformAdminGuard } from './platform-admin.guard';

function executionContext(user: { sub: string } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PlatformAdminGuard', () => {
  const findFirst = jest.fn();
  const prisma = {
    pengguna: { findFirst },
  } as unknown as PrismaService;
  const guard = new PlatformAdminGuard(prisma);

  beforeEach(() => {
    findFirst.mockReset();
  });

  it('mengizinkan pengguna yang memiliki platformRole SUPER_ADMIN', async () => {
    findFirst.mockResolvedValue({ platformRole: PlatformRole.SUPER_ADMIN });

    await expect(guard.canActivate(executionContext({ sub: 'user-1' }))).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: { penggunaId: 'user-1', deletedAt: null },
      select: { platformRole: true },
    });
  });

  it('menolak USER walaupun autentikasi JWT sudah ada', async () => {
    findFirst.mockResolvedValue({ platformRole: PlatformRole.USER });

    await expect(guard.canActivate(executionContext({ sub: 'user-2' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('menolak request tanpa identitas pengguna', async () => {
    await expect(guard.canActivate(executionContext(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findFirst).not.toHaveBeenCalled();
  });
});
