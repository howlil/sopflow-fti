import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationalScope } from '../../../generated/prisma';
import { ProcessRepository } from './process.repository';
import { ProcessService } from './process.service';

describe('ProcessService', () => {
  let service: ProcessService;
  let repository: jest.Mocked<
    Pick<
      ProcessRepository,
      | 'listDepartments'
      | 'createDepartment'
      | 'updateDepartment'
      | 'departmentExists'
      | 'listAssignableUsers'
      | 'findActiveUsersByIds'
      | 'listProcesses'
      | 'findProcessById'
      | 'createProcess'
      | 'updateProcess'
    >
  >;

  beforeEach(async () => {
    repository = {
      listDepartments: jest.fn(),
      createDepartment: jest.fn(),
      updateDepartment: jest.fn(),
      departmentExists: jest.fn(),
      listAssignableUsers: jest.fn(),
      findActiveUsersByIds: jest.fn(),
      listProcesses: jest.fn(),
      findProcessById: jest.fn(),
      createProcess: jest.fn(),
      updateProcess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessService,
        { provide: ProcessRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(ProcessService);
  });

  it('menolak FACULTY Process yang membawa departmentId', async () => {
    await expect(
      service.createProcess({
        nama: 'Layanan TI',
        scope: OrganizationalScope.FACULTY,
        departmentId: '11111111-1111-4111-8111-111111111111',
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak DEPARTMENT Process tanpa departmentId', async () => {
    await expect(
      service.createProcess({
        nama: 'Tugas Akhir',
        scope: OrganizationalScope.DEPARTMENT,
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menolak Process Owner yang juga diduplikasi sebagai member', async () => {
    const ownerId = '22222222-2222-4222-8222-222222222222';

    await expect(
      service.createProcess({
        nama: 'Layanan TI',
        scope: OrganizationalScope.FACULTY,
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
      service.createProcess({
        nama: 'Layanan TI',
        scope: OrganizationalScope.FACULTY,
        ownerId: '22222222-2222-4222-8222-222222222222',
        memberIds: ['33333333-3333-4333-8333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('membuat DEPARTMENT Process dengan tepat satu owner dan member contextual', async () => {
    const departmentId = '11111111-1111-4111-8111-111111111111';
    const ownerId = '22222222-2222-4222-8222-222222222222';
    const memberId = '33333333-3333-4333-8333-333333333333';
    repository.departmentExists.mockResolvedValue(true);
    repository.findActiveUsersByIds.mockResolvedValue([
      { penggunaId: ownerId },
      { penggunaId: memberId },
    ]);
    repository.createProcess.mockResolvedValue({} as never);

    await service.createProcess({
      nama: '  Tugas Akhir  ',
      scope: OrganizationalScope.DEPARTMENT,
      departmentId,
      ownerId,
      memberIds: [memberId],
    });

    expect(repository.createProcess).toHaveBeenCalledWith({
      nama: 'Tugas Akhir',
      scope: OrganizationalScope.DEPARTMENT,
      departmentId,
      ownerId,
      memberIds: [memberId],
    });
  });
});
