import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PelaksanaRepository } from './pelaksana.repository';

describe('PelaksanaRepository global catalog', () => {
  const prismaMock = {
    pelaksana: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    langkahSOP: { count: jest.fn() },
    detailSOPPelaksana: { count: jest.fn() },
  };

  let repo: PelaksanaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PelaksanaRepository(prismaMock as unknown as PrismaService);
  });

  it('lists Pelaksana globally without organization scoping', async () => {
    prismaMock.pelaksana.findMany.mockResolvedValueOnce([]);
    await repo.findAll();
    expect(prismaMock.pelaksana.findMany).toHaveBeenCalledWith({
      select: {
        pelaksanaId: true,
        nama: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nama: 'asc' },
    });
  });

  it('looks up a global Pelaksana by id and by name', async () => {
    prismaMock.pelaksana.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await repo.findById('actor-1');
    await repo.findByNama('Dosen');

    expect(prismaMock.pelaksana.findUnique).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { pelaksanaId: 'actor-1' } }),
    );
    expect(prismaMock.pelaksana.findUnique).toHaveBeenNthCalledWith(2, {
      where: { nama: 'Dosen' },
      select: { pelaksanaId: true, nama: true },
    });
  });

  it('keeps delete protection queries for both step and swimlane references', async () => {
    prismaMock.langkahSOP.count.mockResolvedValueOnce(2);
    prismaMock.detailSOPPelaksana.count.mockResolvedValueOnce(3);
    await expect(repo.countLangkahReferences('actor-1')).resolves.toBe(2);
    await expect(repo.countSwimlaneReferences('actor-1')).resolves.toBe(3);
  });
});
