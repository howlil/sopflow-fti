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

    const findManyMock = prismaMock.pengguna.findMany as unknown as {
      mock: { calls: unknown[][] };
    };
    const args = findManyMock.mock.calls[0]?.[0] as {
      orderBy: unknown;
      select: Record<string, unknown>;
    };
    expect(args.orderBy).toEqual([{ deletedAt: 'asc' }, { nama: 'asc' }, { email: 'asc' }]);
    expect(args.select).not.toHaveProperty('peran');
  });

  it('creates a native USER without fabricated retired identity fields', async () => {
    prismaMock.pengguna.create.mockResolvedValueOnce({
      penggunaId: 'native-user-1',
      platformRole: 'USER',
    });

    await repo.createPlatformAccount({
      email: 'native@example.test',
      nama: 'Native User',
      nip: '199001010000000001',
      jabatan: 'Anggota Proses Bisnis',
      pangkat: 'IV/a',
      nohp: '6281234567890',
      kataSandi: 'hash',
    });

    const createMock = prismaMock.pengguna.create as unknown as { mock: { calls: unknown[][] } };
    const args = createMock.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
      select: Record<string, unknown>;
    };
    expect(args.data).not.toHaveProperty('peran');
    expect(args.select).not.toHaveProperty('peran');
  });
});
