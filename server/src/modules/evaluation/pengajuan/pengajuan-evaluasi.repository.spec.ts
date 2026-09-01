import {
  JenisPengajuanEvaluasi,
  StatusPengajuanEvaluasi,
  StatusSOP,
} from '../../../generated/prisma';
import { PengajuanEvaluasiRepository } from './pengajuan-evaluasi.repository';

const transactionParams = {
  opdId: 'opd-1',
  jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
  sopDetailIds: ['detail-1'],
  activeStatuses: [StatusPengajuanEvaluasi.SEDANG_DIEVALUASI],
  eligibleDetailStatuses: [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI],
} as const;

function buildTransactionMock() {
  return {
    $queryRaw: jest.fn().mockResolvedValue([{ opdId: 'opd-1' }]),
    pengajuanEvaluasi: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ pengajuanEvaluasiId: 'peng-1' }),
    },
    detailSOP: {
      findMany: jest.fn().mockResolvedValue([
        {
          detailSopId: 'detail-1',
          status: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
        },
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function buildPrismaWithTransaction(tx: ReturnType<typeof buildTransactionMock>) {
  return {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
  };
}

describe('Pengujian PengajuanEvaluasiRepository.buildWhere dari query', () => {
  const repo = new PengajuanEvaluasiRepository(null as never);

  it('seharusnya menggunakan status In ketika non kosong dan mengabaikan tunggal status', () => {
    const actual = repo.buildWhereFromQuery({
      status: StatusPengajuanEvaluasi.SEDANG_DIEVALUASI,
      statusIn: [
        StatusPengajuanEvaluasi.DITANDATANGANI_PJ_EVALUATOR,
        StatusPengajuanEvaluasi.DITANDATANGANI_PJ_PENYUSUN,
      ],
    });
    expect(actual).toEqual({
      AND: [
        {
          status: {
            in: [
              StatusPengajuanEvaluasi.DITANDATANGANI_PJ_EVALUATOR,
              StatusPengajuanEvaluasi.DITANDATANGANI_PJ_PENYUSUN,
            ],
          },
        },
      ],
    });
  });

  it('seharusnya memakai status tunggal ketika daftar status kosong', () => {
    const actual = repo.buildWhereFromQuery({
      statusIn: [],
      status: StatusPengajuanEvaluasi.DITANDATANGANI_PJ_EVALUATOR,
    });
    expect(actual).toEqual({
      AND: [{ status: StatusPengajuanEvaluasi.DITANDATANGANI_PJ_EVALUATOR }],
    });
  });
});

describe('Pengujian transaksi atomik pengajuan evaluasi', () => {
  it('seharusnya mengunci OPD lalu membuat pengajuan dan mempromosikan detail', async () => {
    const tx = buildTransactionMock();
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.createPengajuanDenganLock(transactionParams);

    expect(actual).toEqual({ ok: true, pengajuanEvaluasiId: 'peng-1' });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.pengajuanEvaluasi.findFirst).toHaveBeenCalledWith({
      where: {
        opdId: 'opd-1',
        status: { in: [StatusPengajuanEvaluasi.SEDANG_DIEVALUASI] },
      },
      select: { pengajuanEvaluasiId: true },
    });
    expect(tx.detailSOP.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          detailSopId: { in: ['detail-1'] },
          sop: { opdId: 'opd-1' },
        },
      }),
    );
    expect(tx.pengajuanEvaluasi.create).toHaveBeenCalledTimes(1);
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: {
        detailSopId: { in: ['detail-1'] },
        status: { in: [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI] },
      },
      data: { status: StatusSOP.SEDANG_DIEVALUASI },
    });
  });

  it('seharusnya berhenti sebelum membaca detail ketika ada pengajuan aktif', async () => {
    const tx = buildTransactionMock();
    tx.pengajuanEvaluasi.findFirst.mockResolvedValue({ pengajuanEvaluasiId: 'existing' });
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.createPengajuanDenganLock(transactionParams);

    expect(actual).toEqual({ ok: false, error: 'ACTIVE_EXISTS' });
    expect(tx.detailSOP.findMany).not.toHaveBeenCalled();
    expect(tx.pengajuanEvaluasi.create).not.toHaveBeenCalled();
  });

  it('seharusnya mengembalikan detail tidak ditemukan ketika id bukan milik OPD', async () => {
    const tx = buildTransactionMock();
    tx.detailSOP.findMany.mockResolvedValue([]);
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.createPengajuanDenganLock(transactionParams);

    expect(actual).toEqual({
      ok: false,
      error: 'DETAIL_NOT_FOUND',
      detailSopId: 'detail-1',
    });
    expect(tx.pengajuanEvaluasi.create).not.toHaveBeenCalled();
  });

  it('seharusnya mengembalikan status detail tidak valid sebelum menulis', async () => {
    const tx = buildTransactionMock();
    tx.detailSOP.findMany.mockResolvedValue([{ detailSopId: 'detail-1', status: StatusSOP.DRAFT }]);
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.createPengajuanDenganLock(transactionParams);

    expect(actual).toEqual({
      ok: false,
      error: 'DETAIL_BAD_STATUS',
      detailSopId: 'detail-1',
      status: StatusSOP.DRAFT,
    });
    expect(tx.pengajuanEvaluasi.create).not.toHaveBeenCalled();
  });

  it('seharusnya mengubah mismatch update menjadi STATUS_DRIFT dan me-rollback transaksi', async () => {
    const tx = buildTransactionMock();
    tx.detailSOP.updateMany.mockResolvedValue({ count: 0 });
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.createPengajuanDenganLock(transactionParams);

    expect(actual).toEqual({ ok: false, error: 'STATUS_DRIFT' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.pengajuanEvaluasi.create).toHaveBeenCalledTimes(1);
  });

  it('ensure evaluator seharusnya menjadi no-op sukses ketika pengajuan aktif sudah ada', async () => {
    const tx = buildTransactionMock();
    tx.pengajuanEvaluasi.findFirst.mockResolvedValue({ pengajuanEvaluasiId: 'existing' });
    const prisma = buildPrismaWithTransaction(tx);
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    const actual = await repository.ensurePengajuanRequestOpdDenganLock({
      ...transactionParams,
      jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
    });

    expect(actual).toEqual({ ok: true, created: false });
    expect(tx.pengajuanEvaluasi.create).not.toHaveBeenCalled();
  });
});

describe('Pengujian read repository tanpa side effect', () => {
  const signedAt = new Date('2026-06-04T08:37:30.794Z');
  const staleSignedPengajuan = {
    pengajuanEvaluasiId: 'peng-1',
    status: StatusPengajuanEvaluasi.DITANDATANGANI_PJ_PENYUSUN,
    opdId: 'opd-1',
    nilaiEvaluasi: [
      {
        detailSop: {
          detailSopId: 'detail-1',
          sopId: 'sop-1',
          status: StatusSOP.DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI,
          tanggalEfektif: null,
          sop: { opdId: 'opd-1' },
          dokumenTte: [
            {
              dokumenTteId: 'doc-1',
              pdfPath: 'opd/sop/detail.pdf',
              pdfSha256: 'sha256',
              pdfStatus: 'PUBLISHED',
              riwayatTandaTangan: [{ userId: 'kepala-1', ditandatanganiPada: signedAt }],
            },
          ],
        },
      },
    ],
  };

  it('findByIdFull seharusnya hanya membaca tanpa menjalankan transaksi repair', async () => {
    const prisma = {
      pengajuanEvaluasi: {
        findUnique: jest.fn().mockResolvedValue(staleSignedPengajuan),
      },
      $transaction: jest.fn(),
    };
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    await repository.findByIdFull('peng-1');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.pengajuanEvaluasi.findUnique).toHaveBeenCalledTimes(1);
  });

  it('findManyFiltered seharusnya hanya membaca tanpa menjalankan transaksi repair', async () => {
    const prisma = {
      pengajuanEvaluasi: {
        findMany: jest.fn().mockResolvedValue([staleSignedPengajuan]),
        findUnique: jest.fn().mockResolvedValue(staleSignedPengajuan),
      },
      $transaction: jest.fn(),
    };
    const repository = new PengajuanEvaluasiRepository(prisma as never);

    await repository.findManyFiltered({});

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.pengajuanEvaluasi.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.pengajuanEvaluasi.findUnique).not.toHaveBeenCalled();
  });
});
