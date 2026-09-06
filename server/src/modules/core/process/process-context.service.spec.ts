import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessLifecycleStatus } from '../../../generated/prisma';
import { ProcessContextService } from './process-context.service';

describe('ProcessContextService', () => {
  it('returns only active processes where the user is owner or member', async () => {
    const findMany = jest.fn().mockResolvedValue([{ processId: 'process-a' }]);
    const lifecycleFindMany = jest.fn().mockResolvedValue([{ processId: 'process-archived' }]);
    const prisma = {
      process: { findMany },
      processLifecycle: { findMany: lifecycleFindMany },
    } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.listForUser('user-1')).resolves.toEqual([{ processId: 'process-a' }]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          processId: { notIn: ['process-archived'] },
          OR: [{ ownerId: 'user-1' }, { members: { some: { penggunaId: 'user-1' } } }],
        },
      }),
    );
  });

  it('rejects a user unrelated to an active process', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = {
      process: { findFirst },
      processLifecycle: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.assertCanAuthor('user-2', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects authoring when the Process is archived', async () => {
    const prisma = {
      process: { findFirst: jest.fn() },
      processLifecycle: {
        findUnique: jest.fn().mockResolvedValue({ status: ProcessLifecycleStatus.ARCHIVED }),
      },
    } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.assertCanAuthor('owner-1', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows review only when the user owns an active process', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ processId: 'process-a', ownerId: 'owner-1' })
      .mockResolvedValueOnce(null);
    const prisma = {
      process: { findFirst },
      processLifecycle: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.assertCanReview('owner-1', 'process-a')).resolves.toMatchObject({
      processId: 'process-a',
    });
    await expect(service.assertCanReview('member-1', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { processId: 'process-a', ownerId: 'owner-1' } }),
    );
  });
});
