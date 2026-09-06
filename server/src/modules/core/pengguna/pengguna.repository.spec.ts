import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PenggunaRepository } from './pengguna.repository';

describe('PenggunaRepository native platform accounts', () => {
  const prismaMock = {
    pengguna: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let repo: PenggunaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PenggunaRepository(prismaMock as unknown as PrismaService);
  });

  it('lists only public platform-account fields', async () => {
    prismaMock.pengguna.findMany.mockResolvedValueOnce([]);

    await repo.listPlatformAccounts();

    expect(prismaMock.pengguna.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        select: expect.not.objectContaining({
          peran: expect.anything(),
          opdId: expect.anything(),
        }),
      }),
    );
  });

  it('creates a native USER without fabricated role or OPD shadow', async () => {
    prismaMock.pengguna.create.mockResolvedValueOnce({
      penggunaId: 'native-user-1',
      platformRole: 'USER',
    });

    await repo.createPlatformAccount({
      email: 'native@example.test',
      nama: 'Native User',
      nip: '199001010000000001',
      jabatan: 'Process Member',
      pangkat: 'IV/a',
      nohp: '6281234567890',
      kataSandi: 'hash',
    });

    expect(prismaMock.pengguna.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        peran: expect.anything(),
        opdId: expect.anything(),
      }),
      select: expect.not.objectContaining({
        peran: expect.anything(),
        opdId: expect.anything(),
      }),
    });
  });
});
