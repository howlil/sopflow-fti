import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganizationalAuthority, StatusSOP } from '../../../generated/prisma';
import type { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProcessFinalApprovalService } from './process-final-approval.service';

jest.mock('../catalog/sop-catalog.mapper', () => ({
  mapWorkbenchPayload: jest.fn(() => ({ detail: { id: 'detail-a' }, langkah: [] })),
}));

const user = { sub: 'dean-1', peran: 'PENYUSUN' } as never;

function makeService(status: StatusSOP = StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR) {
  const prisma = {
    detailSOP: {
      findFirst: jest.fn().mockResolvedValue({ detailSopId: 'detail-a' }),
    },
    processSopBinding: {
      findUnique: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    },
    processFinalApproval: {
      create: jest.fn().mockResolvedValue({
        detailSopId: 'detail-a',
        processId: 'process-a',
        approvedById: 'dean-1',
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
      }),
    },
  } as unknown as PrismaService;
  const authority = {
    assertCanApprove: jest.fn().mockResolvedValue({
      authority: OrganizationalAuthority.DEAN,
      authorityKey: 'DEAN',
      holderId: 'dean-1',
      holderName: 'Dekan FTI',
      holderNip: '19800001',
      holderJabatan: 'Dekan',
    }),
  } as unknown as OrganizationalAuthorityService;
  const catalog = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
    }),
    findLatestDetailStatusContext: jest.fn().mockResolvedValue({ status }),
    findWorkbenchPayloadByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      status,
    }),
  } as unknown as SopCatalogRepository;
  return {
    service: new ProcessFinalApprovalService(prisma, authority, catalog),
    prisma,
    authority,
    catalog,
  };
}

describe('ProcessFinalApprovalService', () => {
  it('persists approval only from the contextual resolved authority', async () => {
    const { service, prisma, authority } = makeService();

    await expect(service.approve(user, 'detail-a')).resolves.toMatchObject({
      approvedById: 'dean-1',
      authority: OrganizationalAuthority.DEAN,
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'process-a');
    expect(prisma.processFinalApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        detailSopId: 'detail-a',
        processId: 'process-a',
        approvedById: 'dean-1',
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
      }),
    });
  });

  it('allows the contextual approver to read the frozen SOP document without Process membership', async () => {
    const { service, authority, catalog } = makeService();

    await expect(service.getDocumentForCurrentApprover(user, 'detail-a')).resolves.toEqual({
      workbench: { detail: { id: 'detail-a' }, langkah: [] },
      authority: {
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
        holderId: 'dean-1',
        holderName: 'Dekan FTI',
        holderNip: '19800001',
        holderJabatan: 'Dekan',
      },
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'process-a');
    expect(catalog.findWorkbenchPayloadByDetailOrSopId).toHaveBeenCalledWith('detail-a', 0);
  });

  it('rejects document reads outside the final approval/TTE state', async () => {
    const { service } = makeService(StatusSOP.SEDANG_DIEVALUASI);

    await expect(service.getDocumentForCurrentApprover(user, 'detail-a')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects approval before Process Owner accepted the SOP', async () => {
    const { service } = makeService(StatusSOP.SEDANG_DIEVALUASI);

    await expect(service.approve(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects direct approval of an older SOP version', async () => {
    const { service, prisma, authority } = makeService();
    (prisma.detailSOP.findFirst as jest.Mock).mockResolvedValue({ detailSopId: 'detail-newer' });

    await expect(service.approve(user, 'detail-a')).rejects.toThrow(
      'Final approval hanya dapat diberikan pada versi SOP terbaru',
    );
    expect(authority.assertCanApprove).not.toHaveBeenCalled();
    expect(prisma.processFinalApproval.create).not.toHaveBeenCalled();
  });
});
