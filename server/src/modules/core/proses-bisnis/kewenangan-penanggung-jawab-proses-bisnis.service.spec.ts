import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { LingkupOrganisasi, PlatformRole, JenisAktivitasProsesBisnis } from '../../../generated/prisma';
import { KewenanganPenanggungJawabProsesBisnisService } from './kewenangan-penanggung-jawab-proses-bisnis.service';

describe('KewenanganPenanggungJawabProsesBisnisService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const adminId = '22222222-2222-4222-8222-222222222222';

  function makeService() {
    const prisma = {
      pengguna: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      departemen: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      kewenanganPenanggungJawabProsesBisnis: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      riwayatAktivitasProsesBisnis: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (work: unknown) => {
      if (typeof work === 'function') return work(prisma);
      return Promise.all(work as Promise<unknown>[]);
    });
    return {
      prisma,
      service: new KewenanganPenanggungJawabProsesBisnisService(prisma as unknown as PrismaService),
    };
  }

  it('grants FACULTY kelayakan penanggung jawab Proses Bisnis without creating workflow/TTE authority', async () => {
    const { prisma, service } = makeService();
    prisma.pengguna.findFirst.mockResolvedValue({ platformRole: PlatformRole.USER });
    prisma.kewenanganPenanggungJawabProsesBisnis.upsert.mockResolvedValue({
      kewenanganPenanggungJawabProsesBisnisId: '33333333-3333-4333-8333-333333333333',
      penggunaId: userId,
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      kunciLingkup: 'FACULTY',
      grantedById: adminId,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.pengguna.findMany.mockResolvedValue([
      { penggunaId: userId, nama: 'Owner', email: 'owner@fti.test', nip: '1', deletedAt: null },
    ]);
    prisma.departemen.findMany.mockResolvedValue([]);

    await service.grant(adminId, {
      penggunaId: userId,
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
    });

    expect(prisma.kewenanganPenanggungJawabProsesBisnis.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { penggunaId_kunciLingkup: { penggunaId: userId, kunciLingkup: 'FACULTY' } },
      }),
    );
    expect(prisma.riwayatAktivitasProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: adminId,
        event: JenisAktivitasProsesBisnis.OWNER_AUTHORITY_GRANTED,
        targetUserId: userId,
      }),
    });
  });

  it('rejects Proses Bisnis creation outside the granted owner lingkup', async () => {
    const { prisma, service } = makeService();
    prisma.kewenanganPenanggungJawabProsesBisnis.findUnique.mockResolvedValue(null);

    await expect(
      service.assertCanCreate(userId, LingkupOrganisasi.FACULTY, null),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
