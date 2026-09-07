import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LingkupOrganisasi } from '../../../generated/prisma';
import { ProsesBisnisRepository } from './process.repository';
import { ProsesBisnisService } from './process.service';

describe('ProsesBisnisService', () => {
  let service: ProsesBisnisService;
  let repository: jest.Mocked<
    Pick<
      ProsesBisnisRepository,
      | 'listDepartemen'
      | 'createDepartemen'
      | 'updateDepartemen'
      | 'departmentExists'
      | 'listAssignableUsers'
      | 'findActiveUsersByIds'
      | 'listProsesBisnis'
      | 'findProsesBisnisById'
      | 'createProsesBisnis'
      | 'updateProsesBisnis'
    >
  >;

  beforeEach(async () => {
    repository = {
      listDepartemen: jest.fn(),
      createDepartemen: jest.fn(),
      updateDepartemen: jest.fn(),
      departmentExists: jest.fn(),
      listAssignableUsers: jest.fn(),
      findActiveUsersByIds: jest.fn(),
      listProsesBisnis: jest.fn(),
      findProsesBisnisById: jest.fn(),
      createProsesBisnis: jest.fn(),
      updateProsesBisnis: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProsesBisnisService,
        { provide: ProsesBisnisRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(ProsesBisnisService);
  });

  it('menolak FACULTY Proses Bisnis yang membawa departemenId', async () => {
    await expect(
      service.createProsesBisnis({
        nama: 'Layanan TI',
        scope: LingkupOrganisasi.FACULTY,
        departemenId: '11111111-1111-4111-8111-111111111111',
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak DEPARTMENT Proses Bisnis tanpa departemenId', async () => {
    await expect(
      service.createProsesBisnis({
        nama: 'Tugas Akhir',
        scope: LingkupOrganisasi.DEPARTMENT,
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak Penanggung Jawab Proses Bisnis yang juga diduplikasi sebagai member', async () => {
    const ownerId = '22222222-2222-4222-8222-222222222222';

    await expect(
      service.createProsesBisnis({
        nama: 'Layanan TI',
        scope: LingkupOrganisasi.FACULTY,
        ownerId,
        memberIds: [ownerId],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak team jika owner atau member bukan pengguna aktif', async () => {
    repository.findActiveUsersByIds.mockResolvedValue([
      { penggunaId: '22222222-2222-4222-8222-222222222222' },
    ]);

    await expect(
      service.createProsesBisnis({
        nama: 'Layanan TI',
        scope: LingkupOrganisasi.FACULTY,
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('membuat DEPARTMENT Proses Bisnis dengan tepat satu owner dan member contextual', async () => {
    const departemenId = '11111111-1111-4111-8111-111111111111';
    const ownerId = '22222222-2222-4222-8222-222222222222';
    const memberId = '33333333-3333-4333-8333-333333333333';
    repository.departmentExists.mockResolvedValue(true);
    repository.findActiveUsersByIds.mockResolvedValue([
      { penggunaId: ownerId },
      { penggunaId: memberId },
    ]);
    repository.createProsesBisnis.mockResolvedValue({} as never);

    await service.createProsesBisnis({
      nama: '  Tugas Akhir  ',
      scope: LingkupOrganisasi.DEPARTMENT,
      departemenId,
      ownerId,
      memberIds: [memberId],
    });

    expect(repository.createProsesBisnis).toHaveBeenCalledWith({
      nama: 'Tugas Akhir',
      scope: LingkupOrganisasi.DEPARTMENT,
      departemenId,
      ownerId,
      memberIds: [memberId],
    });
  });
});
