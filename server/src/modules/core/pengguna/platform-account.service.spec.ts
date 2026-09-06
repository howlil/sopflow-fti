import type { PenggunaRepository } from './pengguna.repository';
import { PlatformAccountService } from './platform-account.service';

jest.mock('../../../common/pengguna/pengguna-admin.util', () => ({
  hashDefaultPassword: jest.fn().mockResolvedValue('hash'),
  requireIndonesianMobileNumber: jest.fn((value: string) => value),
  rethrowPrismaUniqueViolation: jest.fn(),
}));

describe('PlatformAccountService native identity', () => {
  it('creates account without supplying legacy identity fields', async () => {
    const repository = {
      createPlatformAccount: jest.fn().mockResolvedValue({ penggunaId: 'u-1' }),
      listPlatformAccounts: jest.fn(),
    };
    const service = new PlatformAccountService(repository as unknown as PenggunaRepository);

    await service.create({
      email: ' USER@FTI.TEST ',
      nama: ' Native User ',
      nip: ' 198001010000000001 ',
      pangkat: ' IV/a ',
      jabatan: ' Dosen ',
      nohp: '6281234567890',
    });

    expect(repository.createPlatformAccount).toHaveBeenCalledWith({
      email: 'user@fti.test',
      nama: 'Native User',
      nip: '198001010000000001',
      pangkat: 'IV/a',
      jabatan: 'Dosen',
      nohp: '6281234567890',
      kataSandi: 'hash',
    });
  });
});
