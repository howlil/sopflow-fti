import type { ExecutionContext } from '@nestjs/common';
import type { JwtAuthGuard } from '../../../common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PeranPengguna } from '../../../generated/prisma';
import type { ProcessContextService } from '../../core/process/process-context.service';
import { ProcessBoundSopGuard } from './process-bound-sop.guard';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ProcessBoundSopGuard', () => {
  it('is a no-op outside legacy /sop routes', async () => {
    const jwt = { canActivate: jest.fn() } as unknown as JwtAuthGuard;
    const prisma = {} as PrismaService;
    const processContext = {} as ProcessContextService;
    const guard = new ProcessBoundSopGuard(jwt, prisma, processContext);

    await expect(
      guard.canActivate(contextFor({ path: '/api/process-sop/workbench/x', params: { id: 'x' } })),
    ).resolves.toBe(true);
    expect((jwt.canActivate as jest.Mock)).not.toHaveBeenCalled();
  });

  it('is a no-op for public SOP routes', async () => {
    const jwt = { canActivate: jest.fn() } as unknown as JwtAuthGuard;
    const prisma = {} as PrismaService;
    const processContext = {} as ProcessContextService;
    const guard = new ProcessBoundSopGuard(jwt, prisma, processContext);

    await expect(
      guard.canActivate(
        contextFor({ path: '/api/sop/public/dokumen/detail-1', params: { id: 'detail-1' } }),
      ),
    ).resolves.toBe(true);
    expect((jwt.canActivate as jest.Mock)).not.toHaveBeenCalled();
  });

  it('requires Process authoring access when a legacy penyusun touches a bound SOP', async () => {
    const request = {
      path: '/api/sop/langkah/detail-1',
      params: { detailSopId: 'detail-1' },
      user: undefined,
    };
    const jwt = {
      canActivate: jest.fn().mockImplementation(async () => {
        request.user = {
          sub: 'user-1',
          email: 'u@example.test',
          peran: PeranPengguna.PENYUSUN,
          sesiTokenVersion: 1,
        };
        return true;
      }),
    } as unknown as JwtAuthGuard;
    const prisma = {
      sOP: { findUnique: jest.fn().mockResolvedValue(null) },
      detailSOP: { findUnique: jest.fn().mockResolvedValue({ sopId: 'sop-1' }) },
      processSopBinding: {
        findUnique: jest.fn().mockResolvedValue({ processId: 'process-1' }),
      },
    } as unknown as PrismaService;
    const processContext = {
      assertCanAuthor: jest.fn().mockResolvedValue({ processId: 'process-1' }),
    } as unknown as ProcessContextService;
    const guard = new ProcessBoundSopGuard(jwt, prisma, processContext);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(processContext.assertCanAuthor).toHaveBeenCalledWith('user-1', 'process-1');
  });
});
