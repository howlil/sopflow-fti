import { JenisDokumenTte, OrganizationalAuthority, PeranPengguna, StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { ProcessTteRepository } from './process-tte.repository';

const detailSopId = '00000000-0000-4000-8000-000000000010';
const sopId = '00000000-0000-4000-8000-000000000011';
const processId = '00000000-0000-4000-8000-000000000012';
const userId = '00000000-0000-4000-8000-000000000013';
const dokumenTteId = '00000000-0000-4000-8000-000000000014';

function signingContextTx() {
  return {
    detailSOP: {
      findUnique: jest.fn().mockResolvedValue({
        detailSopId,
        sopId,
        nomorSOP: 'SOP-01',
        versi: 2,
        status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
        sop: { opdId: 'opd-1', judul: 'SOP Akademik' },
      }),
      findFirst: jest.fn().mockResolvedValue({ detailSopId }),
      findMany: jest.fn().mockResolvedValue([{ detailSopId: 'detail-old' }]),
      updateMany: jest
        .fn()
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 }),
    },
    processSopBinding: {
      findUnique: jest.fn().mockResolvedValue({ processId }),
    },
    processFinalApproval: {
      findUnique: jest.fn().mockResolvedValue({
        processId,
        approvedById: userId,
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
        approvedAt: new Date('2026-09-01T00:00:00Z'),
      }),
    },
    dokumenTte: {
      findUnique: jest.fn().mockResolvedValue({
        dokumenTteId,
        detailSopId,
        pengajuanEvaluasiId: null,
        jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
      }),
      update: jest.fn(),
      create: jest.fn(),
    },
    riwayatTandaTangan: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
}

const signatureMetadata = {
  signatureValue: 'sig',
  signatureAlgorithm: 'sha256',
  signatureFormat: 'PKCS7_DETACHED',
  certSerialNumber: '01',
  certIssuer: 'issuer',
  certSubject: 'subject',
  certFingerprint: 'f'.repeat(64),
  certValidFrom: new Date('2026-01-01T00:00:00Z'),
  certValidTo: new Date('2027-01-01T00:00:00Z'),
};

describe('ProcessTteRepository effective-state integrity', () => {
  it('propagates target status drift through the transaction boundary so prior supersede is rolled back', async () => {
    const tx = signingContextTx();
    let transactionRolledBack = false;
    const prisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => {
        try {
          return await callback(tx);
        } catch (error) {
          transactionRolledBack = true;
          throw error;
        }
      }),
    } as unknown as PrismaService;
    const repository = new ProcessTteRepository(prisma);

    const result = await repository.finalizeWithArtifact({
      detailOrSopId: detailSopId,
      userId,
      peran: PeranPengguna.PENYUSUN,
      signedAt: new Date('2026-09-01T01:00:00Z'),
      tanggalEfektif: new Date('2026-09-01T00:00:00Z'),
      dokumenTteId,
      pdfPath: 'opd/sop/v2.pdf',
      pdfSha256: 'a'.repeat(64),
      pdfSizeBytes: 100,
      signatureMetadata,
    });

    expect(tx.detailSOP.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { status: StatusSOP.DIGANTIKAN } }),
    );
    expect(tx.detailSOP.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          detailSopId,
          status: StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR,
        }),
        data: expect.objectContaining({ status: StatusSOP.BERLAKU }),
      }),
    );
    expect(transactionRolledBack).toBe(true);
    expect(result).toEqual({ error: 'SOP_STATUS_DRIFT' });
    expect(tx.riwayatTandaTangan.create).not.toHaveBeenCalled();
  });

  it('does not mutate document metadata when the Process SOP version is already signed', async () => {
    const tx = signingContextTx();
    tx.riwayatTandaTangan.findFirst.mockResolvedValue({ userId } as never);
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const repository = new ProcessTteRepository(prisma);

    const result = await repository.prepareDocument({
      detailOrSopId: detailSopId,
      userId,
      hashDokumen: 'b'.repeat(64),
      nomorDokumen: 'SOP-01-v2',
      judulDokumen: 'Pengesahan SOP Akademik',
    });

    expect(result).toEqual({ error: 'ALREADY_SIGNED' });
    expect(tx.dokumenTte.update).not.toHaveBeenCalled();
  });
});
