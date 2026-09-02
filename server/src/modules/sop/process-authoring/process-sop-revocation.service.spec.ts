import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  StatusSOP,
} from '../../../generated/prisma';
import type { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProcessSopRevocationService } from './process-sop-revocation.service';

const user = { sub: 'dean-1', peran: 'PENYUSUN' } as never;

function makeService() {
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
    },
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
  const catalog = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
    }),
    findRiwayatVersiBySopId: jest.fn().mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.BERLAKU },
    ]),
    updateDetailSopStatus: jest.fn().mockResolvedValue(undefined),
  } as unknown as SopCatalogRepository;
  return {
    service: new ProcessSopRevocationService(prisma, authority, catalog),
    prisma,
    authority,
    catalog,
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

  it('revokes BERLAKU through the same contextual authority resolver used by final approval', async () => {
    const { service, authority, catalog } = makeService();

    await expect(service.revoke(user, 'detail-a')).resolves.toEqual({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      processId: 'process-a',
      status: StatusSOP.DICABUT,
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'process-a');
    expect(catalog.updateDetailSopStatus).toHaveBeenCalledWith({
      detailSopId: 'detail-a',
      status: StatusSOP.DICABUT,
      userId: 'dean-1',
    });
  });

  it('rejects revocation while a newer revision is still in flight', async () => {
    const { service, catalog } = makeService();
    (catalog.findRiwayatVersiBySopId as jest.Mock).mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.BERLAKU },
      { detailSopId: 'detail-b', status: StatusSOP.DRAFT },
    ]);

    await expect(service.revoke(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
    expect(catalog.updateDetailSopStatus).not.toHaveBeenCalled();
  });

  it('keeps legacy unbound SOP on the compatibility revocation path', async () => {
    const { service, prisma, authority, catalog } = makeService();
    (prisma.processSopBinding.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.revoke(user, 'detail-a')).rejects.toThrow(
      'SOP legacy belum terikat Process dan tetap memakai workflow kompatibilitas',
    );
    expect(authority.assertCanApprove).not.toHaveBeenCalled();
    expect(catalog.updateDetailSopStatus).not.toHaveBeenCalled();
  });
});
