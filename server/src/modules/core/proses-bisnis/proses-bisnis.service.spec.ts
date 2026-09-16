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
      | 'listMemberDirectory'
      | 'findActiveUser'
      | 'findMemberMembership'
      | 'findProsesBisnis'
      | 'findProcessStatus'
      | 'transferMember'
    >
  >;

  beforeEach(async () => {
    repository = {
      listDepartemen: jest.fn(),
      createDepartemen: jest.fn(),
      updateDepartemen: jest.fn(),
      listAssignableUsers: jest.fn(),
      listProsesBisnis: jest.fn(),
      listMemberDirectory: jest.fn(),
      findActiveUser: jest.fn(),
      findMemberMembership: jest.fn(),
      findProsesBisnis: jest.fn(),
      findProcessStatus: jest.fn(),
      transferMember: jest.fn(),
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

  it('moves an active member atomically through the admin transfer boundary', async () => {
    repository.findActiveUser.mockResolvedValue({ penggunaId: 'user-1', platformRole: 'USER' } as never);
    repository.findMemberMembership
      .mockResolvedValueOnce({ prosesBisnisId: 'source-process', penggunaId: 'user-1' } as never)
      .mockResolvedValueOnce(null);
    repository.findProsesBisnis.mockResolvedValue({ prosesBisnisId: 'target-process', penanggungJawabId: 'owner-2' } as never);
    repository.findProcessStatus.mockResolvedValue(null);

    await expect(service.transferAnggota('user-1', 'source-process', 'target-process')).resolves.toEqual({
      penggunaId: 'user-1',
      fromProsesBisnisId: 'source-process',
      toProsesBisnisId: 'target-process',
    });
    expect(repository.findMemberMembership).toHaveBeenNthCalledWith(1, 'user-1', 'source-process');
    expect(repository.transferMember).toHaveBeenCalledWith('user-1', 'source-process', 'target-process');
  });
});
