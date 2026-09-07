import { ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  PejabatBerwenang,
  JenisNotifikasiProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import type { NotifikasiProsesBisnisService } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import type { SopOfficialPdfService } from '../../sop/pdf/sop-official-pdf.service';
import type { SopPdfStorageService } from '../../sop/pdf/sop-pdf-storage.service';
import type { TteRepository } from '../shared/repository/tte.repository';
import type { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import type { ProsesBisnisTteRepository, ProsesBisnisTteSigningContext } from './tte-proses-bisnis.repository';
import type { TtePdfSigningService } from './tte-pdf-signing.service';
import { ProsesBisnisTteService } from './tte-proses-bisnis.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

const user: JwtAccessPayload = {
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'dean@example.test',
};

const context: ProsesBisnisTteSigningContext = {
  detailSopId: '00000000-0000-4000-8000-000000000010',
  sopId: '00000000-0000-4000-8000-000000000011',
  prosesBisnisId: '00000000-0000-4000-8000-000000000012',
  judulSop: 'SOP Akademik',
  nomorSOP: 'SOP-01',
  versi: 2,
  approval: {
    approvedById: user.sub,
    authority: PejabatBerwenang.DEAN,
    kunciPejabatBerwenang: 'DEAN',
    approvedAt: new Date('2026-09-01T00:00:00Z'),
  },
};

function createService(overrides?: {
  contextResult?: unknown;
  context?: ProsesBisnisTteSigningContext;
  finalizeResult?: unknown;
  processOwnerId?: string;
  authorId?: string;
}) {
  const signingContext = overrides?.context ?? context;
  const finalizeResult =
    overrides?.finalizeResult ?? {
      ok: true,
      detailSopId: signingContext.detailSopId,
      dokumenTteId: 'doc-1',
      authority: signingContext.approval.authority,
      kunciPejabatBerwenang: signingContext.approval.kunciPejabatBerwenang,
    };
  const tx = {
    prosesBisnis: {
      findUnique: jest.fn().mockResolvedValue({
        penanggungJawabId: overrides?.processOwnerId ?? 'owner-1',
        nama: 'Akademik',
      }),
    },
    detailSOP: {
      findUnique: jest.fn().mockResolvedValue({ dibuatOlehId: overrides?.authorId ?? 'author-1' }),
    },
  };
  const processRepo = {
    findSigningContext: jest.fn().mockResolvedValue(
      overrides?.contextResult ?? { ok: true, context: signingContext },
    ),
    prepareDocument: jest.fn().mockResolvedValue({
      ok: true,
      item: { ...signingContext, dokumenTteId: 'doc-1', hashDokumen: 'a'.repeat(64) },
    }),
    finalizeWithArtifact: jest.fn().mockImplementation(async (_params, sideEffect) => {
      if ((finalizeResult as { ok?: boolean }).ok === true && sideEffect !== undefined) {
        await sideEffect(tx as never, signingContext);
      }
      return finalizeResult;
    }),
  } as unknown as jest.Mocked<ProsesBisnisTteRepository>;
  const tteRepo = {
    findPenggunaAktif: jest.fn().mockResolvedValue({
      penggunaId: user.sub,
      nama: 'Dekan FTI',
      email: user.email,
      nip: '198501012009011103',
      jabatan: 'Dekan FTI',
      pangkat: 'Pembina Utama',
    }),
    findKredensial: jest.fn().mockResolvedValue({ hashPin: 'hash', updatedAt: new Date() }),
  } as unknown as jest.Mocked<TteRepository>;
  const publicUrl = {
    resolveDocumentVerifyBaseUrl: jest.fn().mockReturnValue('https://app.test'),
  } as unknown as TtePublicUrlResolver;
  const officialPdf = {
    buildUnsignedOfficialPdf: jest.fn().mockReturnValue(Buffer.from('%PDF-test')),
    stampPengesahanMetadata: jest.fn().mockResolvedValue(Buffer.from('%PDF-stamped')),
  } as unknown as jest.Mocked<SopOfficialPdfService>;
  const storage = {
    buildRelativePath: jest.fn().mockReturnValue('process/sop/v2.pdf'),
    writeOfficialPdf: jest.fn().mockResolvedValue({
      relativePath: 'process/sop/v2.pdf',
      sha256: 'b'.repeat(64),
      sizeBytes: 100,
    }),
    deleteStoredPdf: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SopPdfStorageService>;
  const signer = {
    signOfficialSopPdfWithUserCertificate: jest.fn().mockResolvedValue({
      signedPdf: Buffer.from('%PDF-signed'),
      riwayatMetadata: {
        signatureValue: 'sig',
        signatureAlgorithm: 'sha256',
        signatureFormat: 'PKCS7_DETACHED',
        certSerialNumber: '01',
        certIssuer: 'issuer',
        certSubject: 'subject',
        certFingerprint: 'c'.repeat(64),
        certValidFrom: new Date('2026-01-01T00:00:00Z'),
        certValidTo: new Date('2027-01-01T00:00:00Z'),
      },
    }),
  } as unknown as jest.Mocked<TtePdfSigningService>;
  const notifikasiProsesBisnis = {
    createManyInTransaction: jest.fn().mockImplementation(async (_transaction, inputs) => [
      ...new Set((inputs as { penggunaId: string }[]).map((input) => input.penggunaId)),
    ]),
    emitChangedMany: jest.fn(),
  } as unknown as NotifikasiProsesBisnisService;
  const service = new ProsesBisnisTteService(
    processRepo,
    tteRepo,
    publicUrl,
    officialPdf,
    storage,
    signer,
    notifikasiProsesBisnis,
  );
  return { service, processRepo, storage, signer, notifikasiProsesBisnis, tx };
}

const dto = {
  pin: '1234',
  nomorDokumen: 'SOP-01-v2',
  judulDokumen: 'Pengesahan SOP Akademik',
  pdfBase64: Buffer.from('%PDF-source').toString('base64'),
};

describe('ProsesBisnisTteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('menolak signer yang bukan pengguna yang memberi persetujuan akhir, tanpa melihat legacy role', async () => {
    const otherContext: ProsesBisnisTteSigningContext = {
      ...context,
      approval: { ...context.approval, approvedById: '00000000-0000-4000-8000-000000000099' },
    };
    const { service, processRepo } = createService({ contextResult: { ok: true, context: otherContext } });

    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(ForbiddenException);
    expect(processRepo.prepareDocument).not.toHaveBeenCalled();
  });

  it('menolak SOP yang belum mendapat contextual persetujuan akhir', async () => {
    const { service } = createService({ contextResult: { error: 'NOT_APPROVED' } });
    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(ConflictException);
  });

  it('menandatangani Faculty Proses Bisnis SOP, membuat effective feedback atomically, dan menyimpan contextual signing authority', async () => {
    const { service, processRepo, signer, notifikasiProsesBisnis, tx } = createService();
    const result = await service.sign(user, context.detailSopId, dto);

    expect(signer.signOfficialSopPdfWithUserCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.sub, dokumenTteId: 'doc-1', pin: '1234' }),
    );
    expect(processRepo.finalizeWithArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.sub }),
      expect.any(Function),
    );
    expect(notifikasiProsesBisnis.createManyInTransaction).toHaveBeenCalledWith(
      tx,
      expect.arrayContaining([
        expect.objectContaining({
          penggunaId: 'author-1',
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
          namaProsesBisnis: 'Akademik',
        }),
        expect.objectContaining({
          penggunaId: 'owner-1',
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
        }),
      ]),
    );
    expect(notifikasiProsesBisnis.emitChangedMany).toHaveBeenCalledWith(['author-1', 'owner-1']);
    expect(result).toEqual(expect.objectContaining({
      detailSopId: context.detailSopId,
      authority: PejabatBerwenang.DEAN,
      status: StatusSOP.EFFECTIVE,
    }));
  });

  it('deduplicates effective feedback when original author is also Penanggung Jawab Proses Bisnis', async () => {
    const { service, notifikasiProsesBisnis } = createService({
      authorId: 'owner-author-1',
      processOwnerId: 'owner-author-1',
    });

    await service.sign(user, context.detailSopId, dto);

    expect(notifikasiProsesBisnis.emitChangedMany).toHaveBeenCalledWith(['owner-author-1']);
  });

  it('menandatangani Departemen Proses Bisnis SOP dengan Head of Departemen authority snapshot', async () => {
    const departmentContext: ProsesBisnisTteSigningContext = {
      ...context,
      approval: {
        ...context.approval,
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        kunciPejabatBerwenang: 'HEAD_OF_DEPARTMENT:00000000-0000-4000-8000-000000000020',
      },
    };
    const { service, processRepo } = createService({ context: departmentContext });

    const result = await service.sign(user, departmentContext.detailSopId, dto);

    expect(processRepo.prepareDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        detailOrSopId: departmentContext.detailSopId,
        userId: user.sub,
      }),
    );
    expect(processRepo.finalizeWithArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.sub }),
      expect.any(Function),
    );
    expect(result).toEqual(expect.objectContaining({
      authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
      kunciPejabatBerwenang: departmentContext.approval.kunciPejabatBerwenang,
      status: StatusSOP.EFFECTIVE,
    }));
  });

  it('menghapus artefak file jika finalisasi database gagal dan tidak emits feedback', async () => {
    const { service, storage, notifikasiProsesBisnis } = createService({
      finalizeResult: { error: 'SOP_STATUS_DRIFT' },
    });
    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(/Status SOP berubah/);
    expect(storage.deleteStoredPdf).toHaveBeenCalledWith('process/sop/v2.pdf');
    expect(notifikasiProsesBisnis.emitChangedMany).not.toHaveBeenCalled();
  });
});