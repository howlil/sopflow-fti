/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */

import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  ProcessReviewDecision,
  StatusSOP,
} from '../../../generated/prisma';
import type { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProcessFinalApprovalService } from './process-final-approval.service';

jest.mock('../catalog/sop-catalog.mapper', () => ({
  mapWorkbenchPayload: jest.fn(() => ({ detail: { id: 'detail-a' }, langkah: [] })),
}));

const user = { sub: 'dean-1', email: 'dean@fti.example.test' } as never;

function makeService(
  status: StatusSOP = StatusSOP.FINAL_APPROVAL,
  acceptedReviewId: string | null = 'review-1',
) {
  const findAcceptedReview = jest
    .fn()
    .mockResolvedValue(acceptedReviewId === null ? null : { processReviewId: acceptedReviewId });
  const createApproval = jest.fn().mockResolvedValue({
    detailSopId: 'detail-a',
    processId: 'process-a',
    approvedById: 'dean-1',
    authority: OrganizationalAuthority.DEAN,
    authorityKey: 'DEAN',
  });
  const tx = {
    detailSOP: {
      findUnique: jest.fn().mockResolvedValue({ status }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    processReview: {
      findFirst: findAcceptedReview,
    },
    processFinalApproval: {
      create: createApproval,
    },
  };
  const prisma = {
    detailSOP: {
      findFirst: jest.fn().mockResolvedValue({ detailSopId: 'detail-a' }),
    },
    sOP: {
      findUnique: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    },
    processReview: {
      findFirst: findAcceptedReview,
    },
    processFinalApproval: {
      create: createApproval,
    },
    $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
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
    prisma: prisma as any,
    tx,
    authority: authority as any,
    catalog: catalog as any,
  };
}

describe('ProcessFinalApprovalService', () => {
  it('persists approval only from the contextual resolved authority', async () => {
    const { service, tx, authority } = makeService();

    await expect(service.approve(user, 'detail-a')).resolves.toMatchObject({
      approvedById: 'dean-1',
      authority: OrganizationalAuthority.DEAN,
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'process-a');
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.FINAL_APPROVAL },
      data: { status: StatusSOP.TTE_PENDING, terakhirDieditOlehId: 'dean-1' },
    });
    expect(tx.processFinalApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        detailSopId: 'detail-a',
        processId: 'process-a',
        approvedById: 'dean-1',
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
        processReviewId: 'review-1',
      }),
    });
  });

  it('links new approval evidence to the latest accepted Process Owner review', async () => {
    const { service, tx } = makeService(StatusSOP.FINAL_APPROVAL, 'review-accepted');

    await service.approve(user, 'detail-a');

    expect(tx.processReview.findFirst).toHaveBeenCalledWith({
      where: {
        detailSopId: 'detail-a',
        processId: 'process-a',
        decision: ProcessReviewDecision.ACCEPT,
        nextStatus: StatusSOP.FINAL_APPROVAL,
      },
      orderBy: { createdAt: 'desc' },
      select: { processReviewId: true },
    });
    expect(tx.processFinalApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ processReviewId: 'review-accepted' }),
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
    const { service } = makeService(StatusSOP.PROCESS_REVIEW);

    await expect(service.getDocumentForCurrentApprover(user, 'detail-a')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects approval before Process Owner accepted the SOP', async () => {
    const { service } = makeService(StatusSOP.PROCESS_REVIEW, null);

    await expect(service.approve(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects final approval when accepted Process Owner review evidence is missing', async () => {
    const { service } = makeService(StatusSOP.FINAL_APPROVAL, null);

    await expect(service.approve(user, 'detail-a')).rejects.toThrow(
      'Final approval membutuhkan Process Owner review yang diterima',
    );
  });

  it('rejects direct approval of an older SOP version', async () => {
    const { service, prisma, authority, tx } = makeService();
    prisma.detailSOP.findFirst.mockResolvedValue({ detailSopId: 'detail-newer' });

    await expect(service.approve(user, 'detail-a')).rejects.toThrow(
      'Final approval hanya dapat diberikan pada versi SOP terbaru',
    );
    expect(authority.assertCanApprove).not.toHaveBeenCalled();
    expect(tx.processFinalApproval.create).not.toHaveBeenCalled();
  });
});
