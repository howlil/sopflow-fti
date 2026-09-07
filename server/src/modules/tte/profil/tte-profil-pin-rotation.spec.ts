import * as bcrypt from 'bcrypt';
import { TteCredentialRepository } from '../shared/repository/tte-credential.repository';
import { TteRepository } from '../shared/repository/tte.repository';
import {
  decryptP12Passphrase,
  encryptP12Passphrase,
} from '../shared/utils/tte-crypto.util';
import { TteProfilService } from './tte-profil.service';

describe('TteProfilService PIN rotation', () => {
  const previousSecret = process.env.TTE_ENCRYPTION_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.TTE_ENCRYPTION_SECRET =
      'pin-rotation-test-server-secret-that-is-at-least-32-characters';
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.TTE_ENCRYPTION_SECRET;
    else process.env.TTE_ENCRYPTION_SECRET = previousSecret;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  it('mengganti hash PIN dan mengenkripsi ulang passphrase P12 dalam satu repository write', async () => {
    const oldPin = '123456';
    const newPin = '654321';
    const passphrase = 'personal-p12-passphrase';
    const oldHash = await bcrypt.hash(oldPin, 4);
    const oldEncrypted = encryptP12Passphrase(passphrase, oldPin);
    const updatedAt = new Date('2026-08-10T00:00:00.000Z');
    let persistedCiphertext = '';

    const repository = {
      findPenggunaAktif: jest.fn().mockResolvedValue({
        penggunaId: 'user-1',
        email: 'dean@example.test',
        nama: 'Dekan FTI',
        nip: '198001012006041001',
        jabatan: 'Dekan',
        pangkat: 'Pembina',
      }),
      findKredensial: jest.fn().mockResolvedValue({
        hashPin: oldHash,
        p12Base64: 'dummy-p12-base64',
        p12PassphraseEncrypted: oldEncrypted,
        updatedAt,
      }),
    } as unknown as TteRepository;

    const credentialRepository = {
      updatePinAndEncryptedPassphrase: jest.fn().mockImplementation(
        async (params: {
          userId: string;
          hashPin: string;
          p12PassphraseEncrypted: string | null;
        }) => {
          persistedCiphertext = params.p12PassphraseEncrypted ?? '';
          return {
            hashPin: params.hashPin,
            p12Base64: 'dummy-p12-base64',
            p12PassphraseEncrypted: params.p12PassphraseEncrypted,
            updatedAt,
          };
        },
      ),
    } as unknown as TteCredentialRepository;

    const service = new TteProfilService(repository, credentialRepository);
    await service.updateProfilPin(
      {
        sub: 'user-1',
        email: 'dean@example.test',
      },
      { pinLama: oldPin, pinBaru: newPin },
    );

    expect(credentialRepository.updatePinAndEncryptedPassphrase).toHaveBeenCalledTimes(1);
    expect(persistedCiphertext.startsWith('v2:')).toBe(true);
    expect(decryptP12Passphrase(persistedCiphertext, newPin)).toBe(passphrase);
    expect(() => decryptP12Passphrase(persistedCiphertext, oldPin)).toThrow();
  });
});
