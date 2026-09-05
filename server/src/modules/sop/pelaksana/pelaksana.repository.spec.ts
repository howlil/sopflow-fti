import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PelaksanaRepository } from './pelaksana.repository';

describe('PelaksanaRepository global catalog', () => {
  const prismaMock = {
    oPD: {
      findFirst: jest.fn(),
    },
    pengguna: {
      findMany: jest.fn(),
    },
    pelaksana: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    pelaksanaAuditAttribution: {
      findMany: jest.fn(),
    },
    langkahSOP: { count: jest.fn() },
    detailSOPPelaksana: { count: jest.fn() },
  };

  let repo: PelaksanaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PelaksanaRepository(prismaMock as unknown as PrismaService);
  });

  it('reads a deterministic legacy OPD only as storage compatibility shadow', async () => {
    prismaMock.oPD.findFirst.mockResolvedValueOnce({ opdId: 'legacy-opd' });
    await expect(repo.findLegacyStorageShadow()).resolves.toBe('legacy-opd');
    expect(prismaMock.oPD.findFirst).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { opdId: true },
    });
  });

  it('returns null when no compatibility storage shadow exists', async () => {
    prismaMock.oPD.findFirst.mockResolvedValueOnce(null);
    await expect(repo.findLegacyStorageShadow()).resolves.toBeNull();
  });

  it('lists Pelaksana globally without OPD filtering', async () => {
    prismaMock.pelaksana.findMany.mockResolvedValueOnce([]);
    await repo.findAll();
    expect(prismaMock.pelaksana.findMany).toHaveBeenCalledWith({
      select: {
        pelaksanaId: true,
        opdId: true,
        nama: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nama: 'asc' },
    });
  });

  it('looks up a global Pelaksana by id and by name', async () => {
    prismaMock.pelaksana.findUnique.mockResolvedValueOnce(null);
    prismaMock.pelaksana.findFirst.mockResolvedValueOnce(null);

    await repo.findById('actor-1');
    await repo.findByNama('Dosen');

    expect(prismaMock.pelaksana.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pelaksanaId: 'actor-1' } }),
    );
    expect(prismaMock.pelaksana.findFirst).toHaveBeenCalledWith({
      where: { nama: 'Dosen' },
      select: { pelaksanaId: true, nama: true },
    });
  });

  it('reads creator/editor attribution independently of OPD', async () => {
    prismaMock.pelaksanaAuditAttribution.findMany.mockResolvedValueOnce([]);
    await repo.findAttributionByPelaksanaIds(['actor-1', 'actor-2']);
    expect(prismaMock.pelaksanaAuditAttribution.findMany).toHaveBeenCalledWith({
      where: { pelaksanaId: { in: ['actor-1', 'actor-2'] } },
      select: { pelaksanaId: true, createdById: true, updatedById: true },
    });
  });

  it('resolves attribution user names in one lookup', async () => {
    prismaMock.pengguna.findMany.mockResolvedValueOnce([
      { penggunaId: 'u-1', nama: 'A' },
      { penggunaId: 'u-2', nama: 'B' },
    ]);
    await expect(repo.findPenggunaNames(['u-1', 'u-2', 'u-1'])).resolves.toEqual(
      new Map([
        ['u-1', 'A'],
        ['u-2', 'B'],
      ]),
    );
  });

  it('keeps delete protection queries for both step and swimlane references', async () => {
    prismaMock.langkahSOP.count.mockResolvedValueOnce(2);
    prismaMock.detailSOPPelaksana.count.mockResolvedValueOnce(3);
    await expect(repo.countLangkahReferences('actor-1')).resolves.toBe(2);
    await expect(repo.countSwimlaneReferences('actor-1')).resolves.toBe(3);
  });
});