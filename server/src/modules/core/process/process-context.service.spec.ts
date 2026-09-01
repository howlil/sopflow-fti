import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessContextService } from './process-context.service';

describe('ProcessContextService', () => {
  it('returns only processes where the user is owner or member', async () => {
    const findMany = jest.fn().mockResolvedValue([{ processId: 'process-a' }]);
    const prisma = { process: { findMany } } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.listForUser('user-1')).resolves.toEqual([{ processId: 'process-a' }]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ ownerId: 'user-1' }, { members: { some: { penggunaId: 'user-1' } } }],
        },
      }),
    );
  });

  it('rejects a user unrelated to the process', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { process: { findFirst } } as unknown as PrismaService;
    const service = new ProcessContextService(prisma);

    await expect(service.assertCanAuthor('user-2', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
