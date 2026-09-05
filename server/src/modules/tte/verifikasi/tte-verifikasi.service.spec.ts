import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JenisDokumenTte, OrganizationalAuthority, PeranPengguna } from '../../../generated/prisma';
import { TteRepository } from '../shared/repository/tte.repository';
import { TtePublicUrlResolver } from '../shared/utils/tte-public-url.resolver';
import type { ProcessTteVerificationRepository } from './process-tte-verification.repository';
import { TteVerifikasiService } from './tte-verifikasi.service';

describe('Pengujian TteVerifikasiService', () => {
  let service: TteVerifikasiService;
  let mockTteRepository: Partial<TteRepository>;
  let mockProcessVerificationRepository: jest.Mocked<
    Pick<ProcessTteVerificationRepository, 'findApprovalForSignedDetail'>
  >;
  let mockConfigService: Partial<ConfigService>;

  const defaultRiwayatRow = {
    userId: 'user-123',
    dokumenTteId: 'dok-123',
    ditandatanganiPada: new Date('2026-06-01T10:00:00.000Z'),
    peran: PeranPengguna.PJ_PENYUSUN,
    user: {
      nama: 'Budi Santoso',
      nip: '199001012020121001',
      jabatan: 'Kepala Bagian',
    },
    dokumenTte: {
      dokumenTteId: 'dok-123',
      nomorDokumen: 'SOP/001/2026',
      judulDokumen: 'SOP Keamanan',
      jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
      hashDokumen: 'abc123hash',
      detailSopId: 'sop-1',
      pengajuanEvaluasiId: null,
      processId: 'process-1',
    },
  };

  beforeEach(() => {
    mockTteRepository = {
      findRiwayatPengesahanByUserAndDokumen: jest.fn(),
    };
    mockProcessVerificationRepository = {
      findApprovalForSignedDetail: jest.fn().mockResolvedValue(null),
    };
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'PUBLIC_APP_ORIGIN') return 'https://verify.example.com';
        return undefined;
      }),
    };

    service = new TteVerifikasiService(
      mockTteRepository as TteRepository,
      new TtePublicUrlResolver(mockConfigService as ConfigService),
      mockProcessVerificationRepository as unknown as ProcessTteVerificationRepository,
    );
  });

  describe('getPengesahanPublic', () => {
    it('seharusnya melempar NotFoundException jika data tidak ditemukan (False Case)', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('seharusnya melempar NotFoundException jika relasi dokumenTte putus/null (Worst Case)', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        dokumenTte: null,
      });

      await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('seharusnya melempar NotFoundException jika relasi profil user putus/null (Worst Case)', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        user: null,
      });

      await expect(service.getPengesahanPublic('dok-123', 'user-123')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('seharusnya mengembalikan fallback string kosong jika jabatan bernilai null (Edge Case)', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        user: { ...defaultRiwayatRow.user, jabatan: null },
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');
      expect(result.penandatangan.jabatan).toBe('');
    });

    it('seharusnya mengubah null menjadi undefined untuk sopDetailId jika kosong (Edge Case)', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        dokumenTte: {
          ...defaultRiwayatRow.dokumenTte,
          detailSopId: null,
        },
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');
      expect(result.dokumen.sopDetailId).toBeUndefined();
      expect(mockProcessVerificationRepository.findApprovalForSignedDetail).not.toHaveBeenCalled();
    });

    it('seharusnya memakai payload JSON ketika origin publik tidak dapat ditentukan', async () => {
      const emptyConfigService = { get: jest.fn().mockReturnValue(undefined) };
      const serviceTanpaOrigin = new TteVerifikasiService(
        mockTteRepository as TteRepository,
        new TtePublicUrlResolver(emptyConfigService as unknown as ConfigService),
        mockProcessVerificationRepository as unknown as ProcessTteVerificationRepository,
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

    it('menampilkan Dean dari ProcessFinalApproval, bukan legacy account role', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        peran: PeranPengguna.PENYUSUN,
      });
      mockProcessVerificationRepository.findApprovalForSignedDetail.mockResolvedValue({
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
        approvedById: 'user-123',
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');

      expect(result.peran).toBe(PeranPengguna.PENYUSUN);
      expect(result.authority).toBe(OrganizationalAuthority.DEAN);
      expect(result.authorityLabel).toBe('Dekan');
      expect(mockProcessVerificationRepository.findApprovalForSignedDetail).toHaveBeenCalledWith(
        'sop-1',
        'user-123',
        'process-1',
      );
    });

    it('tidak menganggap histori detail tanpa marker Process sebagai TTE native', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue({
        ...defaultRiwayatRow,
        dokumenTte: {
          ...defaultRiwayatRow.dokumenTte,
          processId: null,
        },
      });
      mockProcessVerificationRepository.findApprovalForSignedDetail.mockResolvedValue({
        authority: OrganizationalAuthority.DEAN,
        authorityKey: 'DEAN',
        approvedById: 'user-123',
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');

      expect(result.authority).toBeUndefined();
      expect(mockProcessVerificationRepository.findApprovalForSignedDetail).not.toHaveBeenCalled();
    });

    it('menampilkan Kepala Departemen dari approval evidence untuk Department Process', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
        defaultRiwayatRow,
      );
      mockProcessVerificationRepository.findApprovalForSignedDetail.mockResolvedValue({
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        authorityKey: 'HEAD_OF_DEPARTMENT:department-a',
        approvedById: 'user-123',
      });

      const result = await service.getPengesahanPublic('dok-123', 'user-123');
      expect(result.authorityLabel).toBe('Kepala Departemen');
    });

    it('seharusnya mengembalikan mapping response dengan lengkap untuk legacy signature', async () => {
      (mockTteRepository.findRiwayatPengesahanByUserAndDokumen as jest.Mock).mockResolvedValue(
        defaultRiwayatRow,
      );

      const result = await service.getPengesahanPublic('dok-123', 'user-123');

      expect(result).toMatchObject({
        userId: 'user-123',
        dokumenTteId: 'dok-123',
        ditandatanganiPada: '2026-06-01T10:00:00.000Z',
        peran: 'PJ_PENYUSUN',
        penandatangan: {
          nama: 'Budi Santoso',
          nip: '199001012020121001',
          jabatan: 'Kepala Bagian',
        },
        dokumen: {
          dokumenTteId: 'dok-123',
          nomorDokumen: 'SOP/001/2026',
          judulDokumen: 'SOP Keamanan',
          jenisDokumen: 'SOP_BERLAKU',
          hashDokumen: 'abc123hash',
          sopDetailId: 'sop-1',
        },
        qrVerificationUrl: 'https://verify.example.com/tte/verifikasi-dokumen/dok-123?h=abc123hash',
      });
      expect(result.authority).toBeUndefined();
    });
  });
});
