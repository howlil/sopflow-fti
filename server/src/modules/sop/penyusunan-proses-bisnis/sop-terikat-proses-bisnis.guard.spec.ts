import type { ExecutionContext } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import type { JwtAuthGuard } from '../../../common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import { ProsesBisnisBoundSopGuard } from './sop-terikat-proses-bisnis.guard';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ProsesBisnisBoundSopGuard', () => {
  it('is a no-op outside legacy /sop routes', async () => {
    const jwt = { canActivate: jest.fn() } as unknown as JwtAuthGuard;
    const prisma = {} as PrismaService;
    const processContext = {} as ProsesBisnisContextService;
    const guard = new ProsesBisnisBoundSopGuard(jwt, prisma, processContext);

    await expect(
      guard.canActivate(contextFor({ path: '/api/sop-proses-bisnis/workbench/x', params: { id: 'x' } })),
    ).resolves.toBe(true);
    expect((jwt.canActivate as jest.Mock)).not.toHaveBeenCalled();
  });

  it('is a no-op for public SOP routes', async () => {
    const jwt = { canActivate: jest.fn() } as unknown as JwtAuthGuard;
    const prisma = {} as PrismaService;
    const processContext = {} as ProsesBisnisContextService;
    const guard = new ProsesBisnisBoundSopGuard(jwt, prisma, processContext);

    await expect(
      guard.canActivate(
        contextFor({ path: '/api/sop/public/dokumen/detail-1', params: { id: 'detail-1' } }),
      ),
    ).resolves.toBe(true);
    expect((jwt.canActivate as jest.Mock)).not.toHaveBeenCalled();
  });

  it('requires Proses Bisnis authoring access when a legacy penyusun touches a bound SOP', async () => {
    const request: {
      path: string;
      params: Record<string, string>;
      user?: JwtAccessPayload;
    } = {
      path: '/api/sop/langkah/detail-1',
      params: { detailSopId: 'detail-1' },
      user: undefined,
    };
    const jwt = {
      canActivate: jest.fn().mockImplementation(async () => {
        request.user = {
          sub: 'user-1',
          email: 'u@example.test',
          sesiTokenVersion: 1,
        };
        return true;
      }),
    } as unknown as JwtAuthGuard;
    const prisma = {
      sOP: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ prosesBisnisId: 'prosesBisnis-1' }),
      },
      detailSOP: { findUnique: jest.fn().mockResolvedValue({ sopId: 'sop-1' }) },
    } as unknown as PrismaService;
    const processContext = {
      assertCanAuthor: jest.fn().mockResolvedValue({ prosesBisnisId: 'prosesBisnis-1' }),
    } as unknown as ProsesBisnisContextService;
    const guard = new ProsesBisnisBoundSopGuard(jwt, prisma, processContext);

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(processContext.assertCanAuthor).toHaveBeenCalledWith('user-1', 'prosesBisnis-1');
  });
});
