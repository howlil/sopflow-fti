import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JenisDokumenTte, PejabatBerwenang } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import type { ProsesBisnisTteVerificationRepository } from './tte-proses-bisnis-verification.repository';
import { TteVerifikasiService } from './tte-verifikasi.service';

describe('TteVerifikasiService', () => {
  let service: TteVerifikasiService;
  let mockTteRepository: Partial<TteRepository>;
  let mockProsesBisnisVerificationRepository: jest.Mocked<
    Pick<ProsesBisnisTteVerificationRepository, 'findApprovalForSignedDetail'>
  >;

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
    },
  };

  beforeEach(() => {
    mockTteRepository = {
      findRiwayatPengesahanByUserAndDokumen: jest.fn(),
    };
    mockProsesBisnisVerificationRepository = {
      findApprovalForSignedDetail: jest.fn().mockResolvedValue({
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        kunciPejabatBerwenang: 'HEAD_OF_DEPARTMENT:department-a',
        approvedById: 'user-123',
      }),
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
      mockProsesBisnisVerificationRepository as unknown as ProsesBisnisTteVerificationRepository,
    );
  });

  it('menolak ketika riwayat pengesahan tidak ditemukan', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(null);

    await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('menolak ketika approval evidence tidak ditemukan', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
      defaultRiwayatRow,
    );
    mockProsesBisnisVerificationRepository.findApprovalForSignedDetail.mockResolvedValue(null);

    await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('menolak ketika authority signature tidak sama dengan persetujuan akhir evidence', async () => {
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
      defaultRiwayatRow,
    );
    mockProsesBisnisVerificationRepository.findApprovalForSignedDetail.mockResolvedValue({
      authority: PejabatBerwenang.DEAN,
      kunciPejabatBerwenang: 'DEAN',
      approvedById: 'user-123',
    });

    await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mengekspos Dean dari native signing dan approval evidence', async () => {
    const row = {
      ...defaultRiwayatRow,
      authority: PejabatBerwenang.DEAN,
      user: { ...defaultRiwayatRow.user, jabatan: 'Dekan' },
    };
    (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(row);
    mockProsesBisnisVerificationRepository.findApprovalForSignedDetail.mockResolvedValue({
      authority: PejabatBerwenang.DEAN,
      kunciPejabatBerwenang: 'DEAN',
      approvedById: 'user-123',
    });

    const result = await service.getPengesahanPublic('dok-123', 'user-123');

    expect(result.authority).toBe(PejabatBerwenang.DEAN);
    expect(result.authorityLabel).toBe('Dekan');
    expect(result).not.toHaveProperty('peran');
    expect(mockProsesBisnisVerificationRepository.findApprovalForSignedDetail).toHaveBeenCalledWith(
      'detail-1',
      'user-123',
      'process-1',
    );
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

  it('memakai payload JSON ketika origin publik tidak tersedia', async () => {
    const emptyConfig = { get: jest.fn().mockReturnValue(undefined) };
    const serviceTanpaOrigin = new TteVerifikasiService(
      mockTteRepository as TteRepository,
      new TtePublicUrlResolver(emptyConfig as unknown as ConfigService),
      mockProsesBisnisVerificationRepository as unknown as ProsesBisnisTteVerificationRepository,
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
