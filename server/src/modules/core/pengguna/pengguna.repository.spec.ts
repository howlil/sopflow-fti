import { PeranPengguna } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PenggunaRepository } from './pengguna.repository';

describe('Pengujian PenggunaRepository.createPengguna', () => {
  const prismaMock = {
    pengguna: {
      create: jest.fn(),
    },
  };

  let repo: PenggunaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PenggunaRepository(prismaMock as unknown as PrismaService);
  });

  it('seharusnya menyimpan membuat input', async () => {
    prismaMock.pengguna.create.mockResolvedValueOnce({ penggunaId: 'u-1' });
    await repo.createPengguna({
      email: 'e@t.com',
      nama: 'N',
      nip: '1',
      jabatan: 'J',
      pangkat: 'P',
      nohp: '0',
      kataSandi: 'hash',
      peran: PeranPengguna.EVALUATOR,
      opd: { connect: { opdId: 'opd-biro' } },
    });
    expect(prismaMock.pengguna.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        peran: PeranPengguna.EVALUATOR,
        opd: { connect: { opdId: 'opd-biro' } },
      }),
    });
  });

  it('seharusnya dapat membuat akun platform tanpa fabricated OPD shadow', async () => {
    const created = { penggunaId: 'native-user-1', platformRole: 'USER' };
    const tx = {
      pengguna: { create: jest.fn().mockResolvedValue(created) },
    };
    const nativePrisma = {
      $transaction: jest.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    };
    const nativeRepo = new PenggunaRepository(nativePrisma as unknown as PrismaService);

    await nativeRepo.createPlatformAccountWithHistory({
      email: 'native@example.test',
      nama: 'Native User',
      nip: '199001010000000001',
      jabatan: 'Process Member',
      pangkat: 'IV/a',
      nohp: '6281234567890',
      kataSandi: 'hash',
    });

    expect(tx.pengguna.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({ opdId: expect.anything() }),
      select: expect.anything(),
    });
  });
});
