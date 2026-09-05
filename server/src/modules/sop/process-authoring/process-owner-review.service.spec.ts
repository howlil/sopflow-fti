/* eslint-disable @typescript-eslint/unbound-method */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  JenisLangkahProsedur,
  OrganizationalAuthority,
  PeranPengguna,
  ProcessNotificationKind,
  StatusSOP,
} from '../../../generated/prisma';
import type { OrganizationalAuthorityService } from '../../core/process/organizational-authority.service';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { ProcessNotificationService } from '../../notifications/process/process-notification.service';
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

function makeService(options?: { owner?: boolean; status?: StatusSOP; transitionCount?: number }) {
  const tx = {
    detailSOP: {
      updateMany: jest.fn().mockResolvedValue({ count: options?.transitionCount ?? 1 }),
    },
    logEditSOP: {
      create: jest.fn().mockResolvedValue({}),
    },
    processReview: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    sOP: {
      findUnique: jest.fn().mockResolvedValue({ processId: 'process-a' }),
    },
    detailSOP: {
      findUnique: jest.fn().mockResolvedValue({ dibuatOlehId: 'author-1' }),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;
  const processContext = {
    assertCanAuthor: jest.fn().mockResolvedValue({
      processId: 'process-a',
      ownerId: 'owner-1',
      nama: 'Akademik',
    }),
    assertCanReview:
      options?.owner === false
        ? jest.fn().mockRejectedValue(new ForbiddenException())
        : jest.fn().mockResolvedValue({
            processId: 'process-a',
            ownerId: 'user-1',
            nama: 'Akademik',
          }),
  } as unknown as ProcessContextService;
  const organizationalAuthority = {
    resolveForProcess: jest.fn().mockResolvedValue({
      authorityKey: 'DEAN',
      authority: OrganizationalAuthority.DEAN,
      departmentId: null,
      holderId: 'dean-1',
      holderName: 'Dean',
      holderNip: '123456789012345678',
      holderJabatan: 'Dean',
      processId: 'process-a',
      processName: 'Akademik',
      scope: 'FACULTY',
    }),
  } as unknown as OrganizationalAuthorityService;
  const processNotifications = {
    createInTransaction: jest.fn().mockResolvedValue(undefined),
    emitChanged: jest.fn(),
  } as unknown as ProcessNotificationService;
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
      sopId: 'sop-a',
      status: StatusSOP.DRAFT,
      versi: 1,
      nomorSOP: '001',
      namaLembaga: 'Fakultas Teknologi Informasi',
      sop: { sopId: 'sop-a', judul: 'SOP', opdId: 'opd-a' },
      dasarHukum: [{ peraturanId: 'p-1' }],
      relasiSopKeluar: [
        {
          detailSopId: 'detail-a',
          detailSopTerkaitId: 'detail-related',
          sopTerkait: {
            detailSopId: 'detail-related',
            sopId: 'sop-related',
            nomorSOP: '002',
            sop: { judul: 'SOP terkait' },
          },
        },
      ],
      swimlanes: [{ pelaksanaId: 'actor-1' }],
      langkahSOP: [
        {
          langkahSopId: 'step-1',
          urutan: 1,
          kegiatan: 'Kerjakan proses',
          jenis: JenisLangkahProsedur.KEGIATAN,
          kelengkapan: 'Dokumen',
          keluaran: 'Hasil',
          keterangan: 'Selesai',
          pelaksanaId: 'actor-1',
          langkahSelanjutnyaYaId: null,
          langkahSelanjutnyaTidakId: null,
        },
      ],
      lampiranPeringatan: [{ teks: 'Peringatan' }],
      lampiranKualifikasiPelaksanaan: [{ teks: 'Kualifikasi' }],
      lampiranPeralatanPerlengkapan: [{ teks: 'Peralatan' }],
      lampiranPencatatanPendataan: [{ teks: 'Pencatatan' }],
    }),
  } as unknown as SopCatalogRepository;
  const authoring = {
    getWorkbench: jest.fn().mockResolvedValue({ detail: { id: 'detail-a' }, langkah: [] }),
  } as unknown as ProcessSopAuthoringService;

  return {
    service: new ProcessOwnerReviewService(
      prisma,
      processContext,
      organizationalAuthority,
      processNotifications,
      repository,
      authoring,
    ),
    prisma,
    processContext,
    organizationalAuthority,
    processNotifications,
    repository,
    authoring,
    tx,
  };
}

describe('ProcessOwnerReviewService', () => {
  it('submits a Process SOP directly into Process Owner review and notifies the Process Owner', async () => {
    const { service, tx, processNotifications } = makeService();

    await service.submitForReview(user, 'detail-a');

    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.DRAFT },
      data: {
        status: StatusSOP.SEDANG_DIEVALUASI,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(tx.logEditSOP.create).toHaveBeenCalled();
    expect(processNotifications.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        processId: 'process-a',
        penggunaId: 'owner-1',
        kind: ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED,
        processName: 'Akademik',
      }),
    );
    expect(processNotifications.emitChanged).toHaveBeenCalledWith('owner-1');
  });

  it('returns a submitted SOP for revision and notifies the original Process author atomically', async () => {
    const { service, prisma, processContext, organizationalAuthority, processNotifications, tx } =
      makeService({
        owner: true,
        status: StatusSOP.SEDANG_DIEVALUASI,
      });

    await service.review(user, 'detail-a', ProcessReviewDecision.REVISION, 'Perbaiki langkah 2');

    expect(processContext.assertCanReview).toHaveBeenCalledWith('user-1', 'process-a');
    expect(prisma.detailSOP.findUnique).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a' },
      select: { dibuatOlehId: true },
    });
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.SEDANG_DIEVALUASI },
      data: {
        status: StatusSOP.REVISI_DARI_EVALUATOR,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(organizationalAuthority.resolveForProcess).not.toHaveBeenCalled();
    expect(processNotifications.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        penggunaId: 'author-1',
        kind: ProcessNotificationKind.PROCESS_REVISION_REQUESTED,
        processName: 'Akademik',
      }),
    );
    expect(tx.processReview.create).toHaveBeenCalledWith({
      data: {
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        processId: 'process-a',
        reviewedById: 'user-1',
        decision: 'REVISION',
        previousStatus: StatusSOP.SEDANG_DIEVALUASI,
        nextStatus: StatusSOP.REVISI_DARI_EVALUATOR,
        catatan: 'Perbaiki langkah 2',
      },
    });
    expect(processNotifications.emitChanged).toHaveBeenCalledWith('author-1');
  });

  it('maps Process Owner acceptance to ready-for-approval and notifies the resolved authority', async () => {
    const { service, tx, organizationalAuthority, processNotifications } = makeService({
      status: StatusSOP.SEDANG_DIEVALUASI,
    });

    await service.review(user, 'detail-a', ProcessReviewDecision.ACCEPT);

    expect(organizationalAuthority.resolveForProcess).toHaveBeenCalledWith('process-a');
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.SEDANG_DIEVALUASI },
      data: {
        status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(processNotifications.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        penggunaId: 'dean-1',
        kind: ProcessNotificationKind.FINAL_APPROVAL_REQUESTED,
        authorityLabel: 'Dean',
      }),
    );
    expect(tx.processReview.create).toHaveBeenCalledWith({
      data: {
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        processId: 'process-a',
        reviewedById: 'user-1',
        decision: 'ACCEPT',
        previousStatus: StatusSOP.SEDANG_DIEVALUASI,
        nextStatus: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
        catatan: null,
      },
    });
    expect(processNotifications.emitChanged).toHaveBeenCalledWith('dean-1');
  });

  it('rejects review decisions outside the submitted Process Owner review state', async () => {
    const { service } = makeService({ status: StatusSOP.DRAFT });

    await expect(
      service.review(user, 'detail-a', ProcessReviewDecision.ACCEPT),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps revision-note input backward-compatible during the expand phase', async () => {
    const { service, tx } = makeService({
      owner: true,
      status: StatusSOP.SEDANG_DIEVALUASI,
    });

    await service.review(user, 'detail-a', ProcessReviewDecision.REVISION);

    expect(tx.processReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        decision: 'REVISION',
        catatan: null,
      }),
    });
  });

  it('rejects a stale concurrent review decision instead of overwriting the winner', async () => {
    const { service, processNotifications, tx } = makeService({
      status: StatusSOP.SEDANG_DIEVALUASI,
      transitionCount: 0,
    });

    await expect(
      service.review(user, 'detail-a', ProcessReviewDecision.ACCEPT),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(processNotifications.createInTransaction).not.toHaveBeenCalled();
    expect(tx.processReview.create).not.toHaveBeenCalled();
  });
});
