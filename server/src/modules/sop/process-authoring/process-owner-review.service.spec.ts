import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PeranPengguna, StatusSOP } from '../../../generated/prisma';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProcessReviewDecision } from './dto/process-review-decision.dto';
import { ProcessOwnerReviewService } from './process-owner-review.service';
import type { ProcessSopAuthoringService } from './process-sop-authoring.service';

const user = {
  sub: 'user-1',
  email: 'user@example.test',
  peran: PeranPengguna.PENYUSUN,
  sesiTokenVersion: 1,
};

function makeService(options?: { owner?: boolean; status?: StatusSOP }) {
  const prisma = {
    processSopBinding: {
      findUnique: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    },
  } as unknown as PrismaService;
  const processContext = {
    assertCanAuthor: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    assertCanReview: options?.owner === false
      ? jest.fn().mockRejectedValue(new ForbiddenException())
      : jest.fn().mockResolvedValue({ processId: 'process-a' }),
  } as unknown as ProcessContextService;
  const repository = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
    }),
    findLatestDetailStatusContext: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      sopOpdId: 'opd-a',
      status: options?.status ?? StatusSOP.DRAFT,
    }),
    findWorkbenchPayloadByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      status: StatusSOP.DRAFT,
      sop: { sopId: 'sop-a', judul: 'SOP', opdId: 'opd-a' },
      dasarHukum: [{ peraturanId: 'p-1' }],
      sopTerkait: [],
      swimlanes: [{ pelaksanaId: 'actor-1' }],
      langkahSOP: [{ langkahSopId: 'step-1' }],
      lampiranPeringatan: [{ teks: 'x' }],
      lampiranKualifikasiPelaksanaan: [{ teks: 'x' }],
      lampiranPeralatanPerlengkapan: [{ teks: 'x' }],
      lampiranPencatatanPendataan: [{ teks: 'x' }],
    }),
    updateDetailSopStatus: jest.fn().mockResolvedValue(undefined),
  } as unknown as SopCatalogRepository;
  const authoring = {
    getWorkbench: jest.fn().mockResolvedValue({ detail: { id: 'detail-a' }, langkah: [] }),
  } as unknown as ProcessSopAuthoringService;

  return {
    service: new ProcessOwnerReviewService(prisma, processContext, repository, authoring),
    prisma,
    processContext,
    repository,
    authoring,
  };
}

describe('ProcessOwnerReviewService', () => {
  it('submits a Process SOP directly into Process Owner review without legacy evaluation intake', async () => {
    const { service, repository } = makeService();

    await service.submitForReview(user, 'detail-a');

    expect(repository.updateDetailSopStatus).toHaveBeenCalledWith({
      detailSopId: 'detail-a',
      status: StatusSOP.SEDANG_DIEVALUASI,
      userId: 'user-1',
    });
  });

  it('allows only the Process Owner to return a submitted SOP for revision', async () => {
    const { service, processContext, repository } = makeService({
      owner: true,
      status: StatusSOP.SEDANG_DIEVALUASI,
    });

    await service.review(user, 'detail-a', ProcessReviewDecision.REVISION);

    expect(processContext.assertCanReview).toHaveBeenCalledWith('user-1', 'process-a');
    expect(repository.updateDetailSopStatus).toHaveBeenCalledWith({
      detailSopId: 'detail-a',
      status: StatusSOP.REVISI_DARI_EVALUATOR,
      userId: 'user-1',
    });
  });

  it('maps Process Owner acceptance to the transitional ready-for-approval status', async () => {
    const { service, repository } = makeService({
      status: StatusSOP.SEDANG_DIEVALUASI,
    });

    await service.review(user, 'detail-a', ProcessReviewDecision.ACCEPT);

    expect(repository.updateDetailSopStatus).toHaveBeenCalledWith({
      detailSopId: 'detail-a',
      status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
      userId: 'user-1',
    });
  });

  it('rejects review decisions outside the submitted Process Owner review state', async () => {
    const { service } = makeService({ status: StatusSOP.DRAFT });

    await expect(service.review(user, 'detail-a', ProcessReviewDecision.ACCEPT)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
