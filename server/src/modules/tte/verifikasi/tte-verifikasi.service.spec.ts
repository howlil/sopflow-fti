import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JenisDokumenTte, PejabatBerwenang, StatusSOP } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import { TteVerifikasiService } from './tte-verifikasi.service';

describe('TteVerifikasiService', () => {
  let service: TteVerifikasiService;
  let mockTteRepository: Partial<TteRepository>;

  const defaultRiwayatRow = {
    userId: 'user-123',
    dokumenTteId: 'dok-123',
    ditandatanganiPada: new Date('2026-06-01T10:00:00.000Z'),
    authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
    user: {
      nama: 'Budi Santoso',
      nip: '199001012020121001',
      jabatan: 'Ketua Jurusan',
    },
    dokumenTte: {
      dokumenTteId: 'dok-123',
      nomorDokumen: 'SOP/001/2026',
      judulDokumen: 'SOP Keamanan',
      jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
      hashDokumen: 'abc123hash',
      detailSopId: 'detail-1',
      prosesBisnisId: 'process-1',
      pdfPath: '/storage/sop/dok-123.pdf',
      pdfStatus: 'PUBLISHED',
      detailSop: {
        status: StatusSOP.EFFECTIVE,
        sop: { prosesBisnisId: 'process-1' },
      },
    },
  };

  beforeEach(() => {
    mockTteRepository = {
      findRiwayatPengesahanByUserAndDokumen: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'PUBLIC_APP_ORIGIN') return 'https://verify.example.com';
        return undefined;
      }),
    };
    service = new TteVerifikasiService(
      mockTteRepository as TteRepository,
      new TtePublicUrlResolver(configService as unknown as ConfigService),
    );
  });

  it('menolak ketika riwayat pengesahan tidak ditemukan', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(null);

    await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mengekspos Dean dari native signing evidence', async () => {
    const row = {
      ...defaultRiwayatRow,
      authority: PejabatBerwenang.DEAN,
      user: { ...defaultRiwayatRow.user, jabatan: 'Dekan' },
    };
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(row);
    const result = await service.getPengesahanPublic('dok-123', 'user-123');

    expect(result.authority).toBe(PejabatBerwenang.DEAN);
    expect(result.authorityLabel).toBe('Dekan');
    expect(result.signatureValid).toBe(true);
    expect(result.currentPublicStatus).toBe('CURRENT');
    expect(result).not.toHaveProperty('peran');
  });

  it('mengekspos Kepala Departemen untuk Departemen Proses Bisnis', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
      defaultRiwayatRow,
    );

    const result = await service.getPengesahanPublic('dok-123', 'user-123');

    expect(result.authority).toBe(PejabatBerwenang.HEAD_OF_DEPARTMENT);
    expect(result.authorityLabel).toBe('Kepala Departemen');
    expect(result.dokumen.sopDetailId).toBe('detail-1');
  });

  it.each([
    [StatusSOP.REVOKED, 'REVOKED'],
    [StatusSOP.SUPERSEDED, 'SUPERSEDED'],
  ] as const)(
    'menandai status histori %s sebagai tidak current',
    async (detailStatus, expectedStatus) => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        dokumenTte: {
          ...defaultRiwayatRow.dokumenTte,
          detailSop: { ...defaultRiwayatRow.dokumenTte.detailSop, status: detailStatus },
          pdfStatus: detailStatus === StatusSOP.REVOKED ? 'REVOKED' : 'SUPERSEDED',
        },
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');

      expect(result.signatureValid).toBe(true);
      expect(result.currentPublicStatus).toBe(expectedStatus);
    },
  );

  it('menandai dokumen efektif tanpa artefak publik sebagai tidak tersedia publik', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
      ...defaultRiwayatRow,
      dokumenTte: { ...defaultRiwayatRow.dokumenTte, pdfPath: null, pdfStatus: null },
    });

    const result = await service.getPengesahanPublic('dok-123', 'user-123');

    expect(result.currentPublicStatus).toBe('NOT_PUBLIC');
  });

  it('memakai payload JSON ketika origin publik tidak tersedia', async () => {
    const emptyConfig = { get: jest.fn().mockReturnValue(undefined) };
    const serviceTanpaOrigin = new TteVerifikasiService(
      mockTteRepository as TteRepository,
      new TtePublicUrlResolver(emptyConfig as unknown as ConfigService),
    );
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
      defaultRiwayatRow,
    );

    const result = await serviceTanpaOrigin.getPengesahanPublic('dok-123', 'user-123');

    expect(result.qrVerificationUrl).toBeNull();
    expect(JSON.parse(result.qrPayload)).toMatchObject({
      t: 'tte-verify-v1',
      dokumenTteId: 'dok-123',
    });
  });

  it('memetakan jabatan null menjadi string kosong', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
      ...defaultRiwayatRow,
      user: { ...defaultRiwayatRow.user, jabatan: null },
    });

    const result = await service.getPengesahanPublic('dok-123', 'user-123');

    expect(result.penandatangan.jabatan).toBe('');
  });
});
