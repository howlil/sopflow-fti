/* eslint-disable @typescript-eslint/unbound-method */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  JenisLangkahProsedur,
  PejabatBerwenang,
  JenisNotifikasiProsesBisnis,
  SatuanWaktu,
  StatusSOP,
} from '../../../generated/prisma';
import type { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import type { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import type { NotifikasiProsesBisnisService } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import type { SopCatalogRepository, SopWorkbenchDbPayload } from '../catalog/sop-catalog.repository';
import { KeputusanPemeriksaanProsesBisnis } from './dto/pemeriksaan-proses-bisnis-decision.dto';
import { ProsesBisnisOwnerReviewService } from './pemeriksaan-penanggung-jawab-proses-bisnis.service';
import type { ProsesBisnisSopAuthoringService } from './sop-proses-bisnis-authoring.service';

const user = {
  sub: 'user-1',
  email: 'user@example.test',
  sesiTokenVersion: 1,
};

function makeWorkbenchPayload(status: StatusSOP): SopWorkbenchDbPayload {
  const t = new Date('2026-09-01T08:00:00.000Z');
  return {
    detailSopId: 'detail-a',
    sopId: 'sop-a',
    status,
    versi: 1,
    nomorSOP: '001',
    tanggalPembuatan: t,
    tanggalRevisi: null,
    tanggalEfektif: null,
    namaLembaga: 'Fakultas Teknologi Informasi',
    dibuatOlehId: 'author-1',
    terakhirDieditOlehId: null,
    revisiDariDetailSopId: null,
    revisiDari: null,
    createdAt: t,
    updatedAt: t,
    sop: {
      sopId: 'sop-a',
      prosesBisnisId: 'prosesBisnis-a',
      judul: 'SOP',
      createdAt: t,
      updatedAt: t,
    },
    dibuatOleh: { penggunaId: 'author-1', nama: 'Penyusun FTI' },
    terakhirDieditOleh: null,
    dasarHukum: [
      {
        detailSopId: 'detail-a',
        peraturanId: 'p-1',
        createdAt: t,
        updatedAt: t,
        peraturan: {
          peraturanId: 'p-1',
          nama: 'Peraturan FTI',
          nomor: '1',
          tahun: 2026,
          tentang: 'Dasar hukum SOP',
          lastEditedById: null,
          createdAt: t,
          updatedAt: t,
        },
      },
    ],
    relasiSopKeluar: [
      {
        detailSopId: 'detail-a',
        detailSopTerkaitId: 'detail-related',
        createdAt: t,
        updatedAt: t,
        sopTerkait: {
          detailSopId: 'detail-related',
          sopId: 'sop-related',
          nomorSOP: '002',
          sop: { judul: 'SOP terkait', sopId: 'sop-related' },
        },
      },
    ],
    relasiSopMasuk: [],
    dokumenTte: [],
    swimlanes: [
      {
        detailSopId: 'detail-a',
        pelaksanaId: 'actor-1',
        urutan: 1,
        createdAt: t,
        updatedAt: t,
        pelaksana: {
          pelaksanaId: 'actor-1',
          nama: 'Penyusun',
          createdAt: t,
          updatedAt: t,
        },
      },
    ],
    langkahSOP: [
      {
        langkahSopId: 'step-1',
        detailSopId: 'detail-a',
        urutan: 1,
        kegiatan: 'Kerjakan proses',
        jenis: JenisLangkahProsedur.KEGIATAN,
        kelengkapan: 'Dokumen',
        keluaran: 'Hasil',
        waktu: 1,
        satuanWaktu: SatuanWaktu.m,
        keterangan: 'Selesai',
        pelaksanaId: 'actor-1',
        langkahSelanjutnyaYaId: null,
        langkahSelanjutnyaTidakId: null,
        createdAt: t,
        updatedAt: t,
        pelaksana: {
          pelaksanaId: 'actor-1',
          nama: 'Penyusun',
          createdAt: t,
          updatedAt: t,
        },
      },
    ],
    lampiranPeringatan: [
      {
        lampiranPeringatanId: 'warning-1',
        detailSopId: 'detail-a',
        teks: 'Peringatan',
        createdAt: t,
        updatedAt: t,
      },
    ],
    lampiranKualifikasiPelaksanaan: [
      {
        lampiranKualifikasiPelaksanaanId: 'qualification-1',
        detailSopId: 'detail-a',
        teks: 'Kualifikasi',
        createdAt: t,
        updatedAt: t,
      },
    ],
    lampiranPeralatanPerlengkapan: [
      {
        lampiranPeralatanPerlengkapanId: 'equipment-1',
        detailSopId: 'detail-a',
        teks: 'Peralatan',
        createdAt: t,
        updatedAt: t,
      },
    ],
    lampiranPencatatanPendataan: [
      {
        lampiranPencatatanPendataanId: 'record-1',
        detailSopId: 'detail-a',
        teks: 'Pencatatan',
        createdAt: t,
        updatedAt: t,
      },
    ],
    logEditSop: [],
    konfigurasiDiagram: [],
  } as unknown as SopWorkbenchDbPayload;
}

function makeService(options?: {
  penanggungJawab?: boolean;
  status?: StatusSOP;
  transitionCount?: number;
  batchDetails?: Array<{
    detailSopId: string;
    sopId: string;
    status: StatusSOP;
    versi: number;
    sop: { prosesBisnisId: string; judul: string };
  }>;
  latestDetails?: Array<{ detailSopId: string; sopId: string }>;
  reviewBatchItems?: Array<{ paketPemeriksaanProsesBisnisId: string }>;
  reviewBatch?: { items: Array<{ detailSop: { status: StatusSOP } }> };
}) {
  const tx = {
    detailSOP: {
      updateMany: jest.fn().mockResolvedValue({ count: options?.transitionCount ?? 1 }),
    },
    pemeriksaanProsesBisnis: {
      create: jest.fn().mockResolvedValue({}),
    },
    paketPemeriksaanProsesBisnis: {
      create: jest.fn().mockResolvedValue({
        paketPemeriksaanProsesBisnisId: 'paket-1',
        status: 'IN_REVIEW',
        diajukanPada: new Date('2026-09-16T00:00:00.000Z'),
      }),
      findUnique: jest.fn().mockResolvedValue(options?.reviewBatch ?? null),
      update: jest.fn().mockResolvedValue({}),
    },
    paketPemeriksaanProsesBisnisItem: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue(options?.reviewBatchItems ?? []),
    },
  };
  const prisma = {
    sOP: {
      findUnique: jest.fn().mockResolvedValue({ prosesBisnisId: 'prosesBisnis-a' }),
    },
    detailSOP: {
      findUnique: jest.fn().mockResolvedValue({ dibuatOlehId: 'author-1' }),
      findMany: jest
        .fn()
        .mockResolvedValueOnce(options?.batchDetails ?? [])
        .mockResolvedValueOnce(options?.latestDetails ?? []),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;
  const processContext = {
    assertCanAuthor: jest.fn().mockResolvedValue({
      prosesBisnisId: 'prosesBisnis-a',
      penanggungJawabId: 'owner-1',
      nama: 'Akademik',
    }),
    assertCanReview:
      options?.penanggungJawab === false
        ? jest.fn().mockRejectedValue(new ForbiddenException())
        : jest.fn().mockResolvedValue({
            prosesBisnisId: 'prosesBisnis-a',
            penanggungJawabId: 'user-1',
            nama: 'Akademik',
          }),
  } as unknown as ProsesBisnisContextService;
  const pejabatBerwenang = {
    resolveForProsesBisnis: jest.fn().mockResolvedValue({
      kunciPejabatBerwenang: 'DEAN',
      authority: PejabatBerwenang.DEAN,
      departemenId: null,
      holderId: 'dean-1',
      holderName: 'Dekan FTI',
      holderNip: '123456789012345678',
      holderJabatan: 'Dekan',
      prosesBisnisId: 'prosesBisnis-a',
      namaProsesBisnis: 'Akademik',
      lingkup: 'FACULTY',
    }),
  } as unknown as PejabatBerwenangService;
  const notifikasiProsesBisnis = {
    createInTransaction: jest.fn().mockResolvedValue(undefined),
    emitChanged: jest.fn(),
  } as unknown as NotifikasiProsesBisnisService;
  const repository = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      prosesBisnisId: 'prosesBisnis-a',
    }),
    findLatestDetailStatusContext: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      prosesBisnisId: 'prosesBisnis-a',
      status: options?.status ?? StatusSOP.DRAFT,
    }),
    findWorkbenchPayloadByDetailOrSopId: jest
      .fn()
      .mockResolvedValue(makeWorkbenchPayload(options?.status ?? StatusSOP.DRAFT)),
  } as unknown as SopCatalogRepository;
  const authoring = {
    getWorkbench: jest.fn().mockResolvedValue({ detail: { id: 'detail-a' }, langkah: [] }),
  } as unknown as ProsesBisnisSopAuthoringService;

  return {
    service: new ProsesBisnisOwnerReviewService(
      prisma,
      processContext,
      pejabatBerwenang,
      notifikasiProsesBisnis,
      repository,
      authoring,
    ),
    prisma,
    processContext,
    pejabatBerwenang,
    notifikasiProsesBisnis,
    repository,
    authoring,
    tx,
  };
}

describe('ProsesBisnisOwnerReviewService', () => {
  it('submits a Proses Bisnis SOP directly into Penanggung Jawab Proses Bisnis review and notifies the Penanggung Jawab Proses Bisnis', async () => {
    const { service, tx, notifikasiProsesBisnis } = makeService({
      batchDetails: [
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          status: StatusSOP.DRAFT,
          versi: 1,
          sop: { prosesBisnisId: 'prosesBisnis-a', judul: 'SOP' },
        },
      ],
      latestDetails: [{ detailSopId: 'detail-a', sopId: 'sop-a' }],
    });

    await service.submitForReview(user, 'detail-a');

    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: {
        detailSopId: { in: ['detail-a'] },
        status: { in: [StatusSOP.DRAFT, StatusSOP.REVISION_REQUIRED] },
      },
      data: {
        status: StatusSOP.PROCESS_REVIEW,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(notifikasiProsesBisnis.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        prosesBisnisId: 'prosesBisnis-a',
        penggunaId: 'owner-1',
        kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
        namaProsesBisnis: 'Akademik',
      }),
    );
    expect(notifikasiProsesBisnis.emitChanged).toHaveBeenCalledWith('owner-1');
  });

  it('returns a submitted SOP for revision and notifies the original Proses Bisnis author atomically', async () => {
    const { service, prisma, processContext, pejabatBerwenang, notifikasiProsesBisnis, tx } =
      makeService({
        penanggungJawab: true,
        status: StatusSOP.PROCESS_REVIEW,
      });

    await service.review(
      user,
      'detail-a',
      KeputusanPemeriksaanProsesBisnis.REVISION,
      'Perbaiki langkah 2',
    );

    expect(processContext.assertCanReview).toHaveBeenCalledWith('user-1', 'prosesBisnis-a');
    expect(prisma.detailSOP.findUnique).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a' },
      select: { dibuatOlehId: true },
    });
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.PROCESS_REVIEW },
      data: {
        status: StatusSOP.REVISION_REQUIRED,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(pejabatBerwenang.resolveForProsesBisnis).not.toHaveBeenCalled();
    expect(notifikasiProsesBisnis.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        penggunaId: 'author-1',
        kind: JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED,
        namaProsesBisnis: 'Akademik',
      }),
    );
    expect(tx.pemeriksaanProsesBisnis.create).toHaveBeenCalledWith({
      data: {
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        prosesBisnisId: 'prosesBisnis-a',
        reviewedById: 'user-1',
        decision: 'REVISION',
        previousStatus: StatusSOP.PROCESS_REVIEW,
        nextStatus: StatusSOP.REVISION_REQUIRED,
        catatan: 'Perbaiki langkah 2',
      },
    });
    expect(notifikasiProsesBisnis.emitChanged).toHaveBeenCalledWith('author-1');
  });

  it('maps Penanggung Jawab Proses Bisnis acceptance directly to TTE and notifies the resolved authority', async () => {
    const { service, tx, pejabatBerwenang, notifikasiProsesBisnis } = makeService({
      status: StatusSOP.PROCESS_REVIEW,
    });

    await service.review(user, 'detail-a', KeputusanPemeriksaanProsesBisnis.ACCEPT);

    expect(pejabatBerwenang.resolveForProsesBisnis).toHaveBeenCalledWith('prosesBisnis-a');
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.PROCESS_REVIEW },
      data: {
        status: StatusSOP.TTE_PENDING,
        terakhirDieditOlehId: 'user-1',
      },
    });
    expect(notifikasiProsesBisnis.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        penggunaId: 'dean-1',
        kind: JenisNotifikasiProsesBisnis.TTE_REQUESTED,
        authorityLabel: 'Dekan',
      }),
    );
    expect(tx.pemeriksaanProsesBisnis.create).toHaveBeenCalledWith({
      data: {
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        prosesBisnisId: 'prosesBisnis-a',
        reviewedById: 'user-1',
        decision: 'ACCEPT',
        previousStatus: StatusSOP.PROCESS_REVIEW,
        nextStatus: StatusSOP.TTE_PENDING,
        catatan: null,
      },
    });
    expect(notifikasiProsesBisnis.emitChanged).toHaveBeenCalledWith('dean-1');
  });

  it('rejects review decisions outside the submitted Penanggung Jawab Proses Bisnis review state', async () => {
    const { service } = makeService({ status: StatusSOP.DRAFT });

    await expect(
      service.review(user, 'detail-a', KeputusanPemeriksaanProsesBisnis.ACCEPT),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('persists an omitted revision note as null', async () => {
    const { service, tx } = makeService({
      penanggungJawab: true,
      status: StatusSOP.PROCESS_REVIEW,
    });

    await service.review(user, 'detail-a', KeputusanPemeriksaanProsesBisnis.REVISION);

    expect(tx.pemeriksaanProsesBisnis.create).toHaveBeenCalledWith({
      data: {
        detailSopId: 'detail-a',
        sopId: 'sop-a',
        prosesBisnisId: 'prosesBisnis-a',
        reviewedById: 'user-1',
        decision: 'REVISION',
        previousStatus: StatusSOP.PROCESS_REVIEW,
        nextStatus: StatusSOP.REVISION_REQUIRED,
        catatan: null,
      },
    });
  });

  it('rejects a stale concurrent review decision instead of overwriting the winner', async () => {
    const { service, notifikasiProsesBisnis, tx } = makeService({
      status: StatusSOP.PROCESS_REVIEW,
      transitionCount: 0,
    });

    await expect(
      service.review(user, 'detail-a', KeputusanPemeriksaanProsesBisnis.ACCEPT),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(notifikasiProsesBisnis.createInTransaction).not.toHaveBeenCalled();
    expect(tx.pemeriksaanProsesBisnis.create).not.toHaveBeenCalled();
  });

  it('submits several complete SOP versions in one Paket Pemeriksaan atomically', async () => {
    const { service, tx, notifikasiProsesBisnis } = makeService({
      transitionCount: 2,
      batchDetails: [
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          status: StatusSOP.DRAFT,
          versi: 1,
          sop: { prosesBisnisId: 'prosesBisnis-a', judul: 'SOP A' },
        },
        {
          detailSopId: 'detail-b',
          sopId: 'sop-b',
          status: StatusSOP.REVISION_REQUIRED,
          versi: 2,
          sop: { prosesBisnisId: 'prosesBisnis-a', judul: 'SOP B' },
        },
      ],
      latestDetails: [
        { detailSopId: 'detail-a', sopId: 'sop-a' },
        { detailSopId: 'detail-b', sopId: 'sop-b' },
      ],
    });

    const result = await service.submitBatchForReview(user, ['detail-a', 'detail-b']);

    expect(result).toEqual(
      expect.objectContaining({
        paketPemeriksaanProsesBisnisId: 'paket-1',
        totalSop: 2,
        menungguPemeriksaan: 2,
        status: 'IN_REVIEW',
      }),
    );
    expect(tx.paketPemeriksaanProsesBisnis.create).toHaveBeenCalled();
    expect(tx.paketPemeriksaanProsesBisnisItem.createMany).toHaveBeenCalledWith({
      data: [
        { paketPemeriksaanProsesBisnisId: 'paket-1', detailSopId: 'detail-a' },
        { paketPemeriksaanProsesBisnisId: 'paket-1', detailSopId: 'detail-b' },
      ],
    });
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: {
        detailSopId: { in: ['detail-a', 'detail-b'] },
        status: { in: [StatusSOP.DRAFT, StatusSOP.REVISION_REQUIRED] },
      },
      data: { status: StatusSOP.PROCESS_REVIEW, terakhirDieditOlehId: 'user-1' },
    });
    expect(notifikasiProsesBisnis.createInTransaction).toHaveBeenCalledTimes(2);
  });

  it('rejects a bulk submission that crosses Proses Bisnis boundaries before opening a transaction', async () => {
    const { service, prisma } = makeService({
      batchDetails: [
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          status: StatusSOP.DRAFT,
          versi: 1,
          sop: { prosesBisnisId: 'prosesBisnis-a', judul: 'SOP A' },
        },
        {
          detailSopId: 'detail-b',
          sopId: 'sop-b',
          status: StatusSOP.DRAFT,
          versi: 1,
          sop: { prosesBisnisId: 'prosesBisnis-b', judul: 'SOP B' },
        },
      ],
    });

    await expect(service.submitBatchForReview(user, ['detail-a', 'detail-b'])).rejects.toThrow(
      'Proses Bisnis yang sama',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a stale version in the preflight and leaves all selected SOPs unchanged', async () => {
    const { service, prisma } = makeService({
      batchDetails: [
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          status: StatusSOP.DRAFT,
          versi: 1,
          sop: { prosesBisnisId: 'prosesBisnis-a', judul: 'SOP A' },
        },
      ],
      latestDetails: [{ detailSopId: 'detail-new', sopId: 'sop-a' }],
    });

    await expect(service.submitBatchForReview(user, ['detail-a'])).rejects.toThrow(
      'belum memenuhi persyaratan',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('marks a Paket Pemeriksaan selesai after its final SOP decision', async () => {
    const { service, tx } = makeService({
      status: StatusSOP.PROCESS_REVIEW,
      reviewBatchItems: [{ paketPemeriksaanProsesBisnisId: 'paket-1' }],
      reviewBatch: {
        items: [
          { detailSop: { status: StatusSOP.TTE_PENDING } },
          { detailSop: { status: StatusSOP.TTE_PENDING } },
        ],
      },
    });

    await service.review(user, 'detail-a', KeputusanPemeriksaanProsesBisnis.ACCEPT);

    expect(tx.paketPemeriksaanProsesBisnis.update).toHaveBeenCalledWith({
      where: { paketPemeriksaanProsesBisnisId: 'paket-1' },
      data: { status: 'COMPLETED', selesaiPada: expect.any(Date) as unknown as Date },
    });
  });
});
