import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalScope,
  ProcessAuditEvent,
  ProcessLifecycleStatus,
} from '../../../generated/prisma';
import type { ProcessOwnerAuthorityService } from './process-owner-authority.service';
import { ProcessOwnerService } from './process-owner.service';

describe('ProcessOwnerService', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const processId = '22222222-2222-4222-8222-222222222222';

  function makeService() {
    const prisma = {
      process: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      processLifecycle: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      processAudit: {
        create: jest.fn(),
      },
      detailSOP: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (work: unknown) => {
      if (typeof work === 'function') return work(prisma);
      return Promise.all(work as Promise<unknown>[]);
    });
    const authority = {
      assertCanCreate: jest.fn(),
      listMine: jest.fn(),
    };
    return {
      prisma,
      authority,
      service: new ProcessOwnerService(
        prisma as unknown as PrismaService,
        authority as unknown as ProcessOwnerAuthorityService,
      ),
    };
  }

  it('creates Process with the current authorized user as owner and no forced initial member', async () => {
    const { prisma, authority, service } = makeService();
    authority.assertCanCreate.mockResolvedValue({
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
      scopeKey: 'FACULTY',
    });
    prisma.process.count.mockResolvedValue(0);
    prisma.process.create.mockResolvedValue({
      processId,
      nama: 'Tata Kelola TI',
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: null,
      owner: { penggunaId: ownerId, nama: 'Owner', email: 'owner@fti.test', nip: '1', platformRole: 'USER' },
      members: [],
    });
    prisma.processLifecycle.findMany.mockResolvedValue([
      {
        processId,
        status: ProcessLifecycleStatus.ACTIVE,
        archivedAt: null,
        archivedReason: null,
        updatedAt: new Date(),
      },
    ]);

    const result = await service.createProcess(ownerId, {
      nama: '  Tata Kelola TI  ',
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
    });

    expect(prisma.process.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          nama: 'Tata Kelola TI',
          scope: OrganizationalScope.FACULTY,
          departmentId: null,
          ownerId,
        },
      }),
    );
    expect(prisma.processAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        processId,
        actorId: ownerId,
        event: ProcessAuditEvent.PROCESS_CREATED,
      }),
    });
    expect(result?.lifecycleStatus).toBe(ProcessLifecycleStatus.ACTIVE);
  });

  it('blocks archive while a Process still has an in-flight SOP lifecycle', async () => {
    const { prisma, service } = makeService();
    prisma.process.findFirst.mockResolvedValue({
      processId,
      nama: 'Tata Kelola TI',
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: null,
      owner: { penggunaId: ownerId },
      members: [],
    });
    prisma.processLifecycle.findUnique.mockResolvedValue({
      processId,
      status: ProcessLifecycleStatus.ACTIVE,
      archivedAt: null,
      archivedReason: null,
      updatedAt: new Date(),
    });
    prisma.detailSOP.count.mockResolvedValue(1);

    await expect(
      service.archiveProcess(ownerId, processId, { reason: 'Tidak digunakan' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.processLifecycle.upsert).not.toHaveBeenCalled();
  });
});
