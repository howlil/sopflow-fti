import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusKeaktifanProsesBisnis } from '../../../generated/prisma';
import { ProsesBisnisContextService } from './konteks-proses-bisnis.service';

describe('ProsesBisnisContextService', () => {
  it('returns only active Proses Bisnis where the user is Penanggung Jawab or Anggota', async () => {
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

  it('returns authoring context only from active Anggota Proses Bisnis', async () => {
    const findMany = jest.fn().mockResolvedValue([{ prosesBisnisId: 'prosesBisnis-a' }]);
    const prisma = {
      prosesBisnis: { findMany },
      statusProsesBisnis: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await service.listAuthoringForUser('penyusun-1');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { anggota: { some: { penggunaId: 'penyusun-1' } } },
      }),
    );
  });

  it('allows SOP authoring only when the user is an Anggota/Penyusun', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ prosesBisnisId: 'prosesBisnis-a' })
      .mockResolvedValueOnce(null);
    const prisma = {
      prosesBisnis: { findFirst },
      statusProsesBisnis: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.assertCanAuthor('penyusun-1', 'prosesBisnis-a')).resolves.toMatchObject({
      prosesBisnisId: 'prosesBisnis-a',
    });
    await expect(service.assertCanAuthor('owner-1', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          prosesBisnisId: 'prosesBisnis-a',
          anggota: { some: { penggunaId: 'penyusun-1' } },
        },
      }),
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

    await expect(service.assertCanAuthor('penyusun-1', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows review only when the user is Penanggung Jawab of an active Proses Bisnis', async () => {
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
  });

  it('allows global catalog mutation for an active Penanggung Jawab or Anggota context', async () => {
    const findFirst = jest.fn().mockResolvedValue({ prosesBisnisId: 'prosesBisnis-a' });
    const prisma = {
      prosesBisnis: { findFirst },
      statusProsesBisnis: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const service = new ProsesBisnisContextService(prisma);

    await expect(service.assertCanManageGlobalCatalog('user-1')).resolves.toBeUndefined();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ penanggungJawabId: 'user-1' }, { anggota: { some: { penggunaId: 'user-1' } } }],
        },
      }),
    );
  });
});
