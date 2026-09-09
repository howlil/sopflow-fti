import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProsesBisnisRepository } from './proses-bisnis.repository';
import { ProsesBisnisService } from './proses-bisnis.service';

describe('ProsesBisnisService', () => {
  let service: ProsesBisnisService;
  let repository: jest.Mocked<
    Pick<
      ProsesBisnisRepository,
      | 'listDepartemen'
      | 'createDepartemen'
      | 'updateDepartemen'
      | 'listAssignableUsers'
      | 'listProsesBisnis'
      | 'getAdminOverview'
    >
  >;

  beforeEach(async () => {
    repository = {
      listDepartemen: jest.fn(),
      createDepartemen: jest.fn(),
      updateDepartemen: jest.fn(),
      listAssignableUsers: jest.fn(),
      listProsesBisnis: jest.fn(),
      getAdminOverview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProsesBisnisService, { provide: ProsesBisnisRepository, useValue: repository }],
    }).compile();

    service = module.get(ProsesBisnisService);
  });

  it('trims a new department before persistence', async () => {
    repository.createDepartemen.mockResolvedValue({} as never);

    await service.createDepartemen({ nama: '  Informatika  ' });

    expect(repository.createDepartemen).toHaveBeenCalledWith('Informatika');
  });

  it('rejects an empty department update', async () => {
    await expect(service.updateDepartemen('department-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.updateDepartemen).not.toHaveBeenCalled();
  });

  it('renames a department through its existing id', async () => {
    repository.updateDepartemen.mockResolvedValue({ departemenId: 'department-1' } as never);

    await service.updateDepartemen('department-1', { nama: '  Informatika Baru  ' });

    expect(repository.updateDepartemen).toHaveBeenCalledWith('department-1', 'Informatika Baru');
  });

  it('delegates admin read models without exposing workflow mutations', async () => {
    repository.listAssignableUsers.mockResolvedValue([]);
    repository.listProsesBisnis.mockResolvedValue([]);

    await expect(service.listAssignableUsers('owner')).resolves.toEqual([]);
    await expect(service.listProsesBisnis()).resolves.toEqual([]);
    expect(repository.listAssignableUsers).toHaveBeenCalledWith('owner');
    expect(repository.listProsesBisnis).toHaveBeenCalledTimes(1);
  });

  it('delegates the Admin overview read model to the repository', async () => {
    const overview = { accounts: { total: 1 } };
    repository.getAdminOverview.mockResolvedValue(overview as never);

    await expect(service.getAdminOverview()).resolves.toEqual(overview);
    expect(repository.getAdminOverview).toHaveBeenCalledTimes(1);
  });
});
