import { execSync } from 'child_process';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JenisDokumenTte, PejabatBerwenang } from '../../../generated/prisma';
import { verifyPdfWithP12 } from '../shared/utils/pdf-signature-verification.util';
import { TtePdfSigningService } from './tte-pdf-signing.service';
import { TteRepository } from '../shared/repository/tte.repository';
import { encryptP12Passphrase } from '../shared/utils/tte-crypto.util';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require(
  require.resolve('pdfkit', { paths: [require.resolve('@signpdf/placeholder-plain')] }),
);

describe('TtePdfSigningService', () => {
  let service: TtePdfSigningService;
  let repository: {
    findPenggunaAktif: jest.Mock;
    findRiwayatForPdfSigning: jest.Mock;
    updateRiwayatPdfSignatureMetadata: jest.Mock;
    findKredensial: jest.Mock;
  };
  let p12Base64 = '';
  const passphrase = 'test-passphrase';
  const deanUser = {
    sub: 'dean-1',
    email: 'dean@fti.example.test',
  };

  beforeAll(() => {
    const output = execSync(`node scripts/generate-pdf-signing-cert.cjs ${passphrase}`, {
      encoding: 'utf8',
    });
    const line = output.split('\n').find((entry) => entry.startsWith('PDF_SIGNING_P12_BASE64='));
    if (!line) throw new Error('Gagal menghasilkan sertifikat uji PDF.');
    p12Base64 = line.split('=')[1];
  });

  beforeEach(async () => {
    repository = {
      findPenggunaAktif: jest.fn(),
      findRiwayatForPdfSigning: jest.fn(),
      updateRiwayatPdfSignatureMetadata: jest.fn(),
      findKredensial: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtePdfSigningService,
        { provide: TteRepository, useValue: repository },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const values: Record<string, unknown> = {
                PDF_SIGNING_ENABLED: true,
                PDF_SIGNING_P12_BASE64: p12Base64,
                PDF_SIGNING_P12_PASSPHRASE: passphrase,
                PDF_SIGNING_REASON: 'Uji',
                PDF_SIGNING_LOCATION: 'Indonesia',
                PDF_SIGNING_CONTACT: '',
              };
              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();
    service = module.get(TtePdfSigningService);
    repository.findPenggunaAktif.mockResolvedValue({
      penggunaId: deanUser.sub,
      nama: 'Dekan FTI',
      nip: '123',
      jabatan: 'Dekan',
      pangkat: 'IV/a',
      email: deanUser.email,
    });
    repository.findKredensial.mockResolvedValue({
      hashPin: 'unused-by-signing-test',
      p12Base64,
      p12PassphraseEncrypted: encryptP12Passphrase(passphrase, '123456'),
      updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    });
  });

  it('tidak menginjeksi signature baru untuk tipe dokumen yang tidak memerlukan PDF signing', async () => {
    const userId = '00000000-0000-4000-8000-0000000000aa';
    const dokumenTteId = '00000000-0000-4000-8000-0000000000bb';
    repository.findRiwayatForPdfSigning.mockResolvedValue({
      userId,
      dokumenTteId,
      authority: PejabatBerwenang.DEAN,
      ditandatanganiPada: new Date('2026-05-01T00:00:00.000Z'),
      dokumenTte: {
        dokumenTteId,
        nomorDokumen: 'DOC-NO-CA',
        judulDokumen: 'Dokumen Tanpa CA',
        jenisDokumen: JenisDokumenTte.BERITA_ACARA_EVALUASI,
      },
      user: {
        penggunaId: userId,
        nama: 'Dekan FTI',
        nip: '198001011234567890',
        jabatan: 'Dekan',
      },
    });
    const pdfBase64 = (await createSamplePdf()).toString('base64');

    const actual = await service.signPdf(
      { sub: userId, email: 'dean@example.test' },
      {
        pin: '123456',
        dokumenTteId,
        userId,
        jenisDokumen: JenisDokumenTte.BERITA_ACARA_EVALUASI,
        pdfBase64,
      },
    );

    expect(actual.signed).toBe(false);
    expect(actual.signatureFormat).toBe('UNSIGNED_NOT_REQUIRED');
    expect(actual.certificate).toBeNull();
    expect(actual.signedPdfBase64).toBe(pdfBase64);
    expect(repository.updateRiwayatPdfSignatureMetadata).not.toHaveBeenCalled();
  });

  it('menyimpan metadata sertifikat dan binding TTE pada PDF SOP', async () => {
    const userId = '00000000-0000-4000-8000-0000000000aa';
    const dokumenTteId = '00000000-0000-4000-8000-0000000000bb';
    repository.findRiwayatForPdfSigning.mockResolvedValue({
      userId,
      dokumenTteId,
      authority: PejabatBerwenang.DEAN,
      ditandatanganiPada: new Date('2026-05-01T00:00:00.000Z'),
      dokumenTte: {
        dokumenTteId,
        nomorDokumen: 'SOP-REAL-CERT',
        judulDokumen: 'SOP Real Cert',
        jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
      },
      user: {
        penggunaId: userId,
        nama: 'Dekan FTI',
        nip: '198001011234567890',
        jabatan: 'Dekan',
      },
    });
    const pdfBase64 = (await createSamplePdf()).toString('base64');

    const actual = await service.signPdf(
      { sub: userId, email: 'dean@example.test' },
      {
        pin: '123456',
        dokumenTteId,
        userId,
        jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
        pdfBase64,
      },
    );

    expect(actual.signed).toBe(true);
    expect(repository.updateRiwayatPdfSignatureMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        dokumenTteId,
        metadata: expect.objectContaining({
          signatureAlgorithm: 'SHA256withRSA',
          signatureFormat: 'PKCS7_DETACHED',
          certFingerprint: actual.certificate?.fingerprint,
          certSerialNumber: actual.certificate?.serialNumber,
        }),
      }),
    );
    const verification = verifyPdfWithP12(
      Buffer.from(actual.signedPdfBase64, 'base64'),
      Buffer.from(p12Base64, 'base64'),
      passphrase,
    );
    expect(verification.signatures[0]?.binding).toEqual({
      dokumenTteId,
      userId,
      jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
    });
    expect(verification.signatures[0]?.signedAt).not.toBeNull();
  });
});

function createSamplePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument() as {
      on(event: string, listener: (...args: unknown[]) => void): void;
      text(value: string): void;
      end(): void;
    };
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.text('Dokumen uji TTE');
    doc.end();
  });
}
