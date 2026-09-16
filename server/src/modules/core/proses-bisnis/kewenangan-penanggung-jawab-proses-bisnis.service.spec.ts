import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { LingkupOrganisasi, PlatformRole } from '../../../generated/prisma';
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
        findFirst: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
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

    expect(prisma.kewenanganPenanggungJawabProsesBisnis.updateMany).toHaveBeenCalledWith({
      where: { penggunaId: userId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.kewenanganPenanggungJawabProsesBisnis.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { penggunaId_kunciLingkup: { penggunaId: userId, kunciLingkup: 'FACULTY' } },
      }),
    );
  });

  it('rejects Proses Bisnis creation with another users or revoked authority', async () => {
    const { prisma, service } = makeService();
    prisma.pengguna.findFirst.mockResolvedValue({ platformRole: PlatformRole.USER });
    prisma.kewenanganPenanggungJawabProsesBisnis.findFirst.mockResolvedValue(null);

    await expect(
      service.assertCanCreateFromAuthority(
        userId,
        '33333333-3333-4333-8333-333333333333',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.kewenanganPenanggungJawabProsesBisnis.findFirst).toHaveBeenCalledWith({
      where: {
        kewenanganPenanggungJawabProsesBisnisId: '33333333-3333-4333-8333-333333333333',
        penggunaId: userId,
        revokedAt: null,
      },
    });
  });

  it('rejects Proses Bisnis creation when an existing authority belongs to SUPER_ADMIN', async () => {
    const { prisma, service } = makeService();
    prisma.pengguna.findFirst.mockResolvedValue({ platformRole: PlatformRole.SUPER_ADMIN });
    prisma.kewenanganPenanggungJawabProsesBisnis.findFirst.mockResolvedValue({
      penggunaId: userId,
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      kunciLingkup: 'FACULTY',
    });

    await expect(
      service.assertCanCreateFromAuthority(
        userId,
        '33333333-3333-4333-8333-333333333333',
      ),
    ).rejects.toMatchObject({ message: 'Akun USER aktif diperlukan untuk membuat Proses Bisnis' });
  });
});
