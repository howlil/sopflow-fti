import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import { PeraturanRepository } from './peraturan.repository';
import { PeraturanService } from './peraturan.service';

describe('PeraturanService global FTI catalog', () => {
  const repo = {
    findMany: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    countDasarHukum: jest.fn(),
    delete: jest.fn(),
  };

  const user: JwtAccessPayload = {
    sub: 'pengguna-1',
    email: 'a@b.c',
  };
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');
  const row = {
    peraturanId: 'per-1',
    nama: 'Permen A',
    nomor: '1',
    tahun: 2026,
    tentang: 'Tentang A',
    lastEditedById: 'u-last',
    lastEditedBy: { penggunaId: 'u-last', nama: 'Budi' },
    createdAt,
    updatedAt,
    dasarHukumCount: 3,
  };

  let service: PeraturanService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PeraturanService(repo as unknown as PeraturanRepository);
  });

  it('lists the global catalog without OPD resolution or filtering', async () => {
    repo.findMany.mockResolvedValue([row]);

    await expect(service.list()).resolves.toEqual([
      {
        id: 'per-1',
        namaPeraturan: 'Permen A',
        nomor: '1',
        tahun: 2026,
        tentang: 'Tentang A',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        lastEditedById: 'u-last',
        lastEditedBy: { id: 'u-last', nama: 'Budi' },
        digunakan: 3,
      },
    ]);
    expect(repo.findMany).toHaveBeenCalledTimes(1);
  });

  it('returns not found when a global regulation does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a regulation with editor attribution but no OPD ownership link', async () => {
    repo.create.mockResolvedValue({ ...row, peraturanId: 'per-new', lastEditedById: user.sub });

    const result = await service.create(user, {
      namaPeraturan: 'Permen A',
      nomor: '1',
      tahun: 2026,
      tentang: 'Tentang A',
    });

    expect(repo.create).toHaveBeenCalledWith({
      nama: 'Permen A',
      nomor: '1',
      tahun: 2026,
      tentang: 'Tentang A',
      lastEditedById: user.sub,
    });
    expect(result.id).toBe('per-new');
  });

  it('maps create unique constraint races to a domain conflict', async () => {
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '1',
      }),
    );

    await expect(
      service.create(user, {
        namaPeraturan: 'Permen A',
        nomor: '1',
        tahun: 2026,
        tentang: 'Tentang A',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates the global master and records the editing user', async () => {
    repo.findById.mockResolvedValue(row);
    repo.update.mockResolvedValue({ ...row, nama: 'Permen Baru', lastEditedById: user.sub });

    const result = await service.update(user, 'per-1', { namaPeraturan: 'Permen Baru' });

    expect(repo.update).toHaveBeenCalledWith('per-1', { nama: 'Permen Baru' }, user.sub);
    expect(result.namaPeraturan).toBe('Permen Baru');
  });

  it('returns the existing global row when update DTO has no patch', async () => {
    repo.findById.mockResolvedValue(row);

    const result = await service.update(user, 'per-1', {});

    expect(result.id).toBe('per-1');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects deletion while the regulation is referenced as dasar hukum', async () => {
    repo.findById.mockResolvedValue(row);
    repo.countDasarHukum.mockResolvedValue(2);

    await expect(service.remove('per-1')).rejects.toBeInstanceOf(ConflictException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes an unreferenced global regulation', async () => {
    repo.findById.mockResolvedValue(row);
    repo.countDasarHukum.mockResolvedValue(0);
    repo.delete.mockResolvedValue(undefined);

    await expect(service.remove('per-1')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('per-1');
  });
});