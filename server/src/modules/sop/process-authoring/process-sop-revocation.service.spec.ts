import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  ProcessNotificationKind,
  StatusSOP,
} from '../../../generated/prisma';
import type { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import type { ProcessNotificationService } from '../../notifications/process/process-notification.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProcessSopRevocationService } from './process-sop-revocation.service';

const user = { sub: 'dean-1', peran: 'PENYUSUN' } as never;

function makeService(options?: { transitionCount?: number }) {
  const tx = {
    detailSOP: {
      updateMany: jest.fn().mockResolvedValue({ count: options?.transitionCount ?? 1 }),
    },
    logEditSOP: {
      create: jest.fn().mockResolvedValue({}),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
  const prisma = {
    process: {
      findMany: jest.fn().mockResolvedValue([
        {
          processId: 'process-a',
          nama: 'Process Fakultas',
          scope: OrganizationalScope.FACULTY,
          departmentId: null,
          department: null,
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({ ownerId: 'owner-1', nama: 'Process Fakultas' }),
    },
    processSopBinding: {
      findMany: jest.fn().mockResolvedValue([{ sopId: 'sop-a', processId: 'process-a' }]),
      findUnique: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    },
    detailSOP: {
      findMany: jest.fn().mockResolvedValue([
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          nomorSOP: 'SOP-001',
          status: StatusSOP.BERLAKU,
          versi: 1,
          updatedAt: new Date('2026-09-03T00:00:00.000Z'),
          sop: { judul: 'SOP Fakultas' },
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({ dibuatOlehId: 'author-1' }),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;
  const authority = {
    listMine: jest.fn().mockResolvedValue([
      {
        authorityKey: 'DEAN',
        authority: OrganizationalAuthority.DEAN,
        departmentId: null,
        holderId: 'dean-1',
      },
    ]),
    assertCanApprove: jest.fn().mockResolvedValue({
      authority: OrganizationalAuthority.DEAN,
      authorityKey: 'DEAN',
      holderId: 'dean-1',
    }),
  } as unknown as OrganizationalAuthorityService;
  const processNotifications = {
    createManyInTransaction: jest.fn().mockResolvedValue(['author-1', 'owner-1']),
    emitChangedMany: jest.fn(),
  } as unknown as ProcessNotificationService;
  const catalog = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
    }),
    findRiwayatVersiBySopId: jest.fn().mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.BERLAKU },
    ]),
  } as unknown as SopCatalogRepository;
  return {
    service: new ProcessSopRevocationService(prisma, authority, processNotifications, catalog),
    prisma,
    authority,
    processNotifications,
    catalog,
    tx,
  };
}

describe('ProcessSopRevocationService', () => {
  it('lists only effective Process SOPs in the current organizational authority scope', async () => {
    const { service } = makeService();

    await expect(service.listForCurrentAuthority(user)).resolves.toEqual([
      expect.objectContaining({
        detailSopId: 'detail-a',
        processId: 'process-a',
        scope: OrganizationalScope.FACULTY,
        judul: 'SOP Fakultas',
      }),
    ]);
  });

  it('revokes BERLAKU and persists author/Process Owner feedback inside the same transaction', async () => {
    const { service, authority, processNotifications, tx } = makeService();

    await expect(service.revoke(user, 'detail-a')).resolves.toEqual({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      processId: 'process-a',
      status: StatusSOP.DICABUT,
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'process-a');
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.BERLAKU },
      data: { status: StatusSOP.DICABUT, terakhirDieditOlehId: 'dean-1' },
    });
    expect(tx.logEditSOP.create).toHaveBeenCalled();
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(processNotifications.createManyInTransaction).toHaveBeenCalledWith(
      tx,
      expect.arrayContaining([
        expect.objectContaining({
          penggunaId: 'author-1',
          kind: ProcessNotificationKind.PROCESS_SOP_REVOKED,
          processName: 'Process Fakultas',
        }),
        expect.objectContaining({
          penggunaId: 'owner-1',
          kind: ProcessNotificationKind.PROCESS_SOP_REVOKED,
        }),
      ]),
    );
    expect(processNotifications.emitChangedMany).toHaveBeenCalledWith(['author-1', 'owner-1']);
  });

  it('rolls back feedback path when the effective status changed concurrently', async () => {
    const { service, processNotifications, tx } = makeService({ transitionCount: 0 });

    await expect(service.revoke(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.logEditSOP.create).not.toHaveBeenCalled();
    expect(processNotifications.createManyInTransaction).not.toHaveBeenCalled();
    expect(processNotifications.emitChangedMany).not.toHaveBeenCalled();
  });

  it('rejects revocation while a newer revision is still in flight', async () => {
    const { service, catalog, processNotifications } = makeService();
    (catalog.findRiwayatVersiBySopId as jest.Mock).mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.BERLAKU },
      { detailSopId: 'detail-b', status: StatusSOP.DRAFT },
    ]);

    await expect(service.revoke(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
    expect(processNotifications.createManyInTransaction).not.toHaveBeenCalled();
  });

  it('keeps legacy unbound SOP on the compatibility revocation path', async () => {
    const { service, prisma, authority, processNotifications } = makeService();
    (prisma.processSopBinding.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.revoke(user, 'detail-a')).rejects.toThrow(
      'SOP legacy belum terikat Process dan tetap memakai workflow kompatibilitas',
    );
    expect(authority.assertCanApprove).not.toHaveBeenCalled();
    expect(processNotifications.createManyInTransaction).not.toHaveBeenCalled();
  });
});
