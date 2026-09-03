import { ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  OrganizationalAuthority,
  PeranPengguna,
  ProcessNotificationKind,
  StatusSOP,
} from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import type { ProcessNotificationService } from '../../notifications/process/process-notification.service';
import type { SopOfficialPdfService } from '../../sop/pdf/sop-official-pdf.service';
import type { SopPdfStorageService } from '../../sop/pdf/sop-pdf-storage.service';
import type { TteRepository } from '../shared/repository/tte.repository';
import type { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import type { ProcessTteRepository, ProcessTteSigningContext } from './process-tte.repository';
import type { TtePdfSigningService } from './tte-pdf-signing.service';
import { ProcessTteService } from './process-tte.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

const user: JwtAccessPayload = {
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'dean@example.test',
  peran: PeranPengguna.PENYUSUN,
};

const context: ProcessTteSigningContext = {
  detailSopId: '00000000-0000-4000-8000-000000000010',
  sopId: '00000000-0000-4000-8000-000000000011',
  opdId: '00000000-0000-4000-8000-000000000012',
  judulSop: 'SOP Akademik',
  nomorSOP: 'SOP-01',
  versi: 2,
  processId: '00000000-0000-4000-8000-000000000013',
  approval: {
    approvedById: user.sub,
    authority: OrganizationalAuthority.DEAN,
    authorityKey: 'DEAN',
    approvedAt: new Date('2026-09-01T00:00:00Z'),
  },
};

function createService(overrides?: {
  contextResult?: unknown;
  context?: ProcessTteSigningContext;
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
      authorityKey: signingContext.approval.authorityKey,
    };
  const tx = {
    process: {
      findUnique: jest.fn().mockResolvedValue({
        ownerId: overrides?.processOwnerId ?? 'owner-1',
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
  } as unknown as jest.Mocked<ProcessTteRepository>;
  const tteRepo = {
    findPenggunaAktif: jest.fn().mockResolvedValue({
      penggunaId: user.sub,
      nama: 'Dekan FTI',
      peran: PeranPengguna.PENYUSUN,
      opdId: signingContext.opdId,
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
    buildRelativePath: jest.fn().mockReturnValue('opd/sop/v2.pdf'),
    writeOfficialPdf: jest.fn().mockResolvedValue({
      relativePath: 'opd/sop/v2.pdf',
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
  const processNotifications = {
    createManyInTransaction: jest.fn().mockImplementation(async (_transaction, inputs) => [
      ...new Set((inputs as { penggunaId: string }[]).map((input) => input.penggunaId)),
    ]),
    emitChangedMany: jest.fn(),
  } as unknown as ProcessNotificationService;
  const service = new ProcessTteService(
    processRepo,
    tteRepo,
    publicUrl,
    officialPdf,
    storage,
    signer,
    processNotifications,
  );
  return { service, processRepo, storage, signer, processNotifications, tx };
}

const dto = {
  pin: '1234',
  nomorDokumen: 'SOP-01-v2',
  judulDokumen: 'Pengesahan SOP Akademik',
  pdfBase64: Buffer.from('%PDF-source').toString('base64'),
};

describe('ProcessTteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('menolak signer yang bukan pengguna yang memberi final approval, tanpa melihat legacy role', async () => {
    const otherContext: ProcessTteSigningContext = {
      ...context,
      approval: { ...context.approval, approvedById: '00000000-0000-4000-8000-000000000099' },
    };
    const { service, processRepo } = createService({ contextResult: { ok: true, context: otherContext } });

    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(ForbiddenException);
    expect(processRepo.prepareDocument).not.toHaveBeenCalled();
  });

  it('menolak SOP yang belum mendapat contextual final approval', async () => {
    const { service } = createService({ contextResult: { error: 'NOT_APPROVED' } });
    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(ConflictException);
  });

  it('menandatangani Faculty Process SOP, membuat effective feedback atomically, dan meneruskan Dean authority snapshot', async () => {
    const { service, processRepo, signer, processNotifications, tx } = createService();
    const result = await service.sign(user, context.detailSopId, dto);

    expect(signer.signOfficialSopPdfWithUserCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.sub, dokumenTteId: 'doc-1', pin: '1234' }),
    );
    expect(processRepo.finalizeWithArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.sub, peran: PeranPengguna.PENYUSUN }),
      expect.any(Function),
    );
    expect(processNotifications.createManyInTransaction).toHaveBeenCalledWith(
      tx,
      expect.arrayContaining([
        expect.objectContaining({
          penggunaId: 'author-1',
          kind: ProcessNotificationKind.PROCESS_SOP_EFFECTIVE,
          processName: 'Akademik',
        }),
        expect.objectContaining({
          penggunaId: 'owner-1',
          kind: ProcessNotificationKind.PROCESS_SOP_EFFECTIVE,
        }),
      ]),
    );
    expect(processNotifications.emitChangedMany).toHaveBeenCalledWith(['author-1', 'owner-1']);
    expect(result).toEqual(expect.objectContaining({
      detailSopId: context.detailSopId,
      authority: OrganizationalAuthority.DEAN,
      status: StatusSOP.BERLAKU,
    }));
  });

  it('deduplicates effective feedback when original author is also Process Owner', async () => {
    const { service, processNotifications } = createService({
      authorId: 'owner-author-1',
      processOwnerId: 'owner-author-1',
    });

    await service.sign(user, context.detailSopId, dto);

    expect(processNotifications.emitChangedMany).toHaveBeenCalledWith(['owner-author-1']);
  });

  it('menandatangani Department Process SOP dengan Head of Department authority snapshot', async () => {
    const departmentContext: ProcessTteSigningContext = {
      ...context,
      approval: {
        ...context.approval,
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        authorityKey: 'HEAD_OF_DEPARTMENT:00000000-0000-4000-8000-000000000020',
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
    expect(result).toEqual(expect.objectContaining({
      authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
      authorityKey: departmentContext.approval.authorityKey,
      status: StatusSOP.BERLAKU,
    }));
  });

  it('menghapus artefak file jika finalisasi database gagal dan tidak emits feedback', async () => {
    const { service, storage, processNotifications } = createService({
      finalizeResult: { error: 'SOP_STATUS_DRIFT' },
    });
    await expect(service.sign(user, context.detailSopId, dto)).rejects.toThrow(/Status SOP berubah/);
    expect(storage.deleteStoredPdf).toHaveBeenCalledWith('opd/sop/v2.pdf');
    expect(processNotifications.emitChangedMany).not.toHaveBeenCalled();
  });
});
