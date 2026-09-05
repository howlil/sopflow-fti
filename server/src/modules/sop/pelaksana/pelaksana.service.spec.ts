import { ConflictException, NotFoundException } from '@nestjs/common';
import { PeranPengguna, Prisma } from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import { PelaksanaRepository } from './pelaksana.repository';
import { PelaksanaService } from './pelaksana.service';

describe('PelaksanaService global catalog', () => {
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByNama: jest.fn(),
    findLegacyStorageShadow: jest.fn(),
    findAttributionByPelaksanaIds: jest.fn(),
    findPenggunaNames: jest.fn(),
    createGlobal: jest.fn(),
    updateNamaGlobal: jest.fn(),
    countLangkahReferences: jest.fn(),
    countSwimlaneReferences: jest.fn(),
    delete: jest.fn(),
  };

  const user: JwtAccessPayload = {
    sub: 'u-1',
    email: 'member@fti.test',
    peran: PeranPengguna.EVALUATOR,
  };
  const row = {
    pelaksanaId: 'pl-1',
    opdId: 'legacy-opd-shadow',
    nama: 'Dosen',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T01:00:00.000Z'),
  };

  let service: PelaksanaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PelaksanaService(repo as unknown as PelaksanaRepository);
    repo.findAttributionByPelaksanaIds.mockResolvedValue([]);
    repo.findPenggunaNames.mockResolvedValue(new Map());
    repo.findByNama.mockResolvedValue(null);
    repo.findLegacyStorageShadow.mockResolvedValue('legacy-opd-shadow');
  });

  it('lists the global catalog without OPD filtering', async () => {
    repo.findAll.mockResolvedValue([row]);

    await expect(service.list()).resolves.toEqual([
      {
        id: 'pl-1',
        namaPelaksana: 'Dosen',
        createdBy: null,
        updatedBy: null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    ]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('creates from a persistence-only storage shadow and records attribution', async () => {
    repo.createGlobal.mockResolvedValue(row);
    repo.findAttributionByPelaksanaIds.mockResolvedValue([
      { pelaksanaId: 'pl-1', createdById: 'u-1', updatedById: 'u-1' },
    ]);
    repo.findPenggunaNames.mockResolvedValue(new Map([['u-1', 'User FTI']]));

    const result = await service.create(user, { namaPelaksana: '  Dosen  ' });

    expect(repo.findLegacyStorageShadow).toHaveBeenCalledTimes(1);
    expect(repo.createGlobal).toHaveBeenCalledWith('legacy-opd-shadow', 'Dosen', 'u-1');
    expect(result.createdBy).toEqual({ id: 'u-1', nama: 'User FTI' });
    expect(result.updatedBy).toEqual({ id: 'u-1', nama: 'User FTI' });
  });

  it('rejects creation when the temporary storage shadow is unavailable', async () => {
    repo.findLegacyStorageShadow.mockResolvedValue(null);

    await expect(service.create(user, { namaPelaksana: 'Dosen' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.createGlobal).not.toHaveBeenCalled();
  });

  it('rejects a duplicate global name before creating another row', async () => {
    repo.findByNama.mockResolvedValue({ pelaksanaId: 'existing', nama: 'Dosen' });

    await expect(service.create(user, { namaPelaksana: 'Dosen' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.createGlobal).not.toHaveBeenCalled();
  });

  it('updates any global actor and records the editing user', async () => {
    repo.findById.mockResolvedValue(row);
    repo.updateNamaGlobal.mockResolvedValue({ ...row, nama: 'Dosen Pengampu' });

    const result = await service.update(user, 'pl-1', { namaPelaksana: 'Dosen Pengampu' });

    expect(repo.updateNamaGlobal).toHaveBeenCalledWith('pl-1', 'Dosen Pengampu', 'u-1');
    expect(result.namaPelaksana).toBe('Dosen Pengampu');
  });

  it('maps database unique races to a global duplicate conflict', async () => {
    repo.createGlobal.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '1',
      }),
    );

    await expect(service.create(user, { namaPelaksana: 'Dosen' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('does not delete an actor that is already referenced by SOP content', async () => {
    repo.findById.mockResolvedValue(row);
    repo.countLangkahReferences.mockResolvedValue(1);
    repo.countSwimlaneReferences.mockResolvedValue(1);

    await expect(service.remove(user, 'pl-1')).rejects.toBeInstanceOf(ConflictException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns not found for unknown actor updates', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.update(user, 'unknown', { namaPelaksana: 'Dosen' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});