import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusKeaktifanProsesBisnis } from '../../../generated/prisma';
import { ProsesBisnisContextService } from './konteks-proses-bisnis.service';

describe('ProsesBisnisContextService', () => {
  it('returns only active prosesBisnis where the user is owner or anggota', async () => {
    const findMany = jest.fn().mockResolvedValue([{ prosesBisnisId: 'prosesBisnis-a' }]);
    const statusFindMany = jest.fn().mockResolvedValue([{ prosesBisnisId: 'prosesBisnis-archived' }]);
    const prisma = {
      prosesBisnis: { findMany },
      statusProsesBisnis: { findMany: statusFindMany },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.listForUser('user-1')).resolves.toEqual([{ prosesBisnisId: 'prosesBisnis-a' }]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          prosesBisnisId: { notIn: ['prosesBisnis-archived'] },
          OR: [{ penanggungJawabId: 'user-1' }, { anggota: { some: { penggunaId: 'user-1' } } }],
        },
      }),
    );
  });

  it('rejects a user unrelated to an active prosesBisnis', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = {
      prosesBisnis: { findFirst },
      statusProsesBisnis: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.assertCanAuthor('user-2', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects authoring when the Proses Bisnis is archived', async () => {
    const prisma = {
      prosesBisnis: { findFirst: jest.fn() },
      statusProsesBisnis: {
        findUnique: jest.fn().mockResolvedValue({ status: StatusKeaktifanProsesBisnis.ARCHIVED }),
      },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.assertCanAuthor('owner-1', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows review only when the user owns an active prosesBisnis', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ prosesBisnisId: 'prosesBisnis-a', penanggungJawabId: 'owner-1' })
      .mockResolvedValueOnce(null);
    const prisma = {
      prosesBisnis: { findFirst },
      statusProsesBisnis: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.assertCanReview('owner-1', 'prosesBisnis-a')).resolves.toMatchObject({
      prosesBisnisId: 'prosesBisnis-a',
    });
    await expect(service.assertCanReview('anggota-1', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { prosesBisnisId: 'prosesBisnis-a', penanggungJawabId: 'owner-1' } }),
    );
  });
});
