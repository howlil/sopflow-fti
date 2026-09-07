import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { JwtAccessPayload } from '../../../common/types/jwt-access-payload.type';
import type { TteRepository } from '../shared/repository/tte.repository';
import { TteProfilService } from './tte-profil.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../shared/utils/generate-p12.util', () => ({
  generatePersonalP12: jest.fn().mockReturnValue(Buffer.from('dummy-p12')),
}));

jest.mock('../shared/utils/tte-crypto.util', () => ({
  decryptP12Passphrase: jest.fn(),
  encryptP12Passphrase: jest.fn().mockReturnValue('encrypted-passphrase'),
}));

jest.mock('../shared/utils/pdf-signing-certificate.util', () => ({
  loadTrustedCertificatesFromP12: jest.fn().mockReturnValue(true),
}));

describe('TteProfilService', () => {
  const user: JwtAccessPayload = {
    sub: 'user-1',
    email: 'dean@example.test',
  };
  const updatedAt = new Date('2026-05-20T03:04:05.000Z');
  const pengguna = {
    penggunaId: user.sub,
    email: user.email,
    nama: 'Dekan FTI',
    nip: '198001012006041001',
    jabatan: 'Dekan',
    pangkat: 'Pembina',
  };
  const kredensial = {
    hashPin: 'hash-lama',
    p12Base64: null,
    p12PassphraseEncrypted: null,
    updatedAt,
  };

  function createRepoMock(
    partial: Partial<jest.Mocked<TteRepository>> = {},
  ): jest.Mocked<TteRepository> {
    return {
      findPenggunaAktif: jest.fn(),
      findKredensial: jest.fn(),
      createKredensialPin: jest.fn(),
      createKredensialPinDanP12: jest.fn(),
      updateKredensialPinHash: jest.fn(),
      updateKredensialP12: jest.fn(),
      findRiwayatPengesahanByUserAndDokumen: jest.fn(),
      findRiwayatForPdfSigning: jest.fn(),
      updateRiwayatPdfSignatureMetadata: jest.fn(),
      findRiwayatByPdfSignatureBinding: jest.fn(),
      ...partial,
    } as unknown as jest.Mocked<TteRepository>;
  }

  function service(repo: jest.Mocked<TteRepository>) {
    return new TteProfilService(repo);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash-baru');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('menolak profil ketika pengguna aktif tidak ditemukan', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(null),
    });

    await expect(service(repo).getProfil(user)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findKredensial).not.toHaveBeenCalled();
  });

  it('mengembalikan null ketika kredensial TTE belum dibuat', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(null),
    });

    await expect(service(repo).getProfil(user)).resolves.toBeNull();
  });

  it('mengembalikan profil kredensial tanpa global workflow role', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(kredensial),
    });

    const actual = await service(repo).getProfil(user);

    expect(actual).toEqual({
      id: user.sub,
      userId: user.sub,
      hasP12: false,
      createdAt: updatedAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      user: {
        id: user.sub,
        nama: 'Dekan FTI',
        email: user.email,
        nip: '198001012006041001',
        jabatan: 'Dekan',
        pangkat: 'Pembina',
      },
    });
    expect(actual).not.toHaveProperty('peran');
  });

  it('menolak pendaftaran PIN ketika kredensial sudah ada', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(kredensial),
    });

    await expect(service(repo).registerProfil(user, { pin: '1234' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('membuat PIN baru untuk pengguna native FTI', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(null),
      createKredensialPin: jest.fn().mockResolvedValue(kredensial),
    });

    const actual = await service(repo).registerProfil(user, { pin: '1234' });

    expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
    expect(repo.createKredensialPin).toHaveBeenCalledWith({
      userId: user.sub,
      hashPin: 'hash-baru',
    });
    expect(actual.userId).toBe(user.sub);
  });

  it('menolak perubahan PIN ketika PIN lama salah', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(kredensial),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service(repo).updateProfilPin(user, { pinLama: '0000', pinBaru: '5678' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('mengubah PIN credential tanpa P12 melalui repository TTE', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(kredensial),
      updateKredensialPinHash: jest.fn().mockResolvedValue({
        ...kredensial,
        hashPin: 'hash-baru',
      }),
    });

    const actual = await service(repo).updateProfilPin(user, {
      pinLama: '1234',
      pinBaru: '5678',
    });

    expect(repo.updateKredensialPinHash).toHaveBeenCalledWith({
      userId: user.sub,
      hashPin: 'hash-baru',
    });
    expect(actual.userId).toBe(user.sub);
  });

  it('menolak generate P12 ketika PIN belum diatur', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(null),
    });

    await expect(service(repo).generateP12(user, { pin: '1234' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('menyimpan P12 personal untuk pengguna FTI', async () => {
    const repo = createRepoMock({
      findPenggunaAktif: jest.fn().mockResolvedValue(pengguna),
      findKredensial: jest.fn().mockResolvedValue(kredensial),
      updateKredensialP12: jest.fn().mockResolvedValue({
        ...kredensial,
        p12Base64: Buffer.from('dummy-p12').toString('base64'),
        p12PassphraseEncrypted: 'encrypted-passphrase',
      }),
    });

    const actual = await service(repo).generateP12(user, { pin: '1234' });

    expect(repo.updateKredensialP12).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.sub,
        p12Base64: Buffer.from('dummy-p12').toString('base64'),
        p12PassphraseEncrypted: 'encrypted-passphrase',
      }),
    );
    expect(actual.hasP12).toBe(true);
  });
});
