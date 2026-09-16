import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import { PelaksanaRepository } from './pelaksana.repository';
import { PelaksanaService } from './pelaksana.service';

describe('PelaksanaService global catalog', () => {
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByNama: jest.fn(),
    createGlobal: jest.fn(),
    updateNamaGlobal: jest.fn(),
    countLangkahReferences: jest.fn(),
    countSwimlaneReferences: jest.fn(),
    delete: jest.fn(),
  };

  const user: JwtAccessPayload = {
    sub: 'u-1',
    email: 'member@fti.test',
  };
  const row = {
    pelaksanaId: 'pl-1',
    nama: 'Dosen',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T01:00:00.000Z'),
  };

  let service: PelaksanaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PelaksanaService(repo as unknown as PelaksanaRepository);
    repo.findByNama.mockResolvedValue(null);
  });

  it('lists the global catalog without organization scoping', async () => {
    repo.findAll.mockResolvedValue([row]);

    await expect(service.list()).resolves.toEqual([
      {
        id: 'pl-1',
        namaPelaksana: 'Dosen',
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    ]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  it('creates a global actor without any organization-scoped storage dependency', async () => {
    repo.createGlobal.mockResolvedValue(row);

    await service.create(user, { namaPelaksana: '  Dosen  ' });

    expect(repo.createGlobal).toHaveBeenCalledWith('Dosen');
  });

  it('rejects a duplicate global name before creating another row', async () => {
    repo.findByNama.mockResolvedValue({ pelaksanaId: 'existing', nama: 'Dosen' });

    await expect(service.create(user, { namaPelaksana: 'Dosen' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.createGlobal).not.toHaveBeenCalled();
  });

  it('updates any global actor', async () => {
    repo.findById.mockResolvedValue(row);
    repo.updateNamaGlobal.mockResolvedValue({ ...row, nama: 'Dosen Pengampu' });

    const result = await service.update(user, 'pl-1', { namaPelaksana: 'Dosen Pengampu' });

    expect(repo.updateNamaGlobal).toHaveBeenCalledWith('pl-1', 'Dosen Pengampu');
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
