import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganizationalScope, PlatformRole, ProcessAuditEvent } from '../../../generated/prisma';
import { ProcessOwnerAuthorityService } from './process-owner-authority.service';

describe('ProcessOwnerAuthorityService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const adminId = '22222222-2222-4222-8222-222222222222';

  function makeService() {
    const prisma = {
      pengguna: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      department: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      processOwnerAuthority: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      processAudit: {
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
      service: new ProcessOwnerAuthorityService(prisma as unknown as PrismaService),
    };
  }

  it('grants FACULTY owner eligibility without creating workflow/TTE authority', async () => {
    const { prisma, service } = makeService();
    prisma.pengguna.findFirst.mockResolvedValue({ platformRole: PlatformRole.USER });
    prisma.processOwnerAuthority.upsert.mockResolvedValue({
      processOwnerAuthorityId: '33333333-3333-4333-8333-333333333333',
      penggunaId: userId,
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
      scopeKey: 'FACULTY',
      grantedById: adminId,
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.pengguna.findMany.mockResolvedValue([
      { penggunaId: userId, nama: 'Owner', email: 'owner@fti.test', nip: '1', deletedAt: null },
    ]);
    prisma.department.findMany.mockResolvedValue([]);

    await service.grant(adminId, {
      penggunaId: userId,
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
    });

    expect(prisma.processOwnerAuthority.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { penggunaId_scopeKey: { penggunaId: userId, scopeKey: 'FACULTY' } },
      }),
    );
    expect(prisma.processAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: adminId,
        event: ProcessAuditEvent.OWNER_AUTHORITY_GRANTED,
        targetUserId: userId,
      }),
    });
  });

  it('rejects Process creation outside the granted owner scope', async () => {
    const { prisma, service } = makeService();
    prisma.processOwnerAuthority.findUnique.mockResolvedValue(null);

    await expect(
      service.assertCanCreate(userId, OrganizationalScope.FACULTY, null),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
