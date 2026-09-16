import type { PenggunaRepository } from './pengguna.repository';
import { PlatformAccountService } from './platform-account.service';
import { ConflictException } from '@nestjs/common';

jest.mock('../../../common/pengguna/pengguna-admin.util', () => ({
  hashDefaultPassword: jest.fn().mockResolvedValue('hash'),
  requireIndonesianMobileNumber: jest.fn((value: string) => value),
  rethrowPrismaUniqueViolation: jest.fn(),
  assertAtLeastOneUpdateField: jest.fn(),
  assertEmailNipUniqueOnUpdate: jest.fn().mockResolvedValue(undefined),
  resolveDeletedAtFromStatus: jest.fn((status: string | undefined, current: Date | null) =>
    status === 'NONAKTIF' ? new Date() : status === 'AKTIF' ? null : current,
  ),
}));

describe('PlatformAccountService native identity', () => {
  it('creates account without supplying legacy identity fields', async () => {
    const repository = {
      createPlatformAccount: jest.fn().mockResolvedValue({ penggunaId: 'u-1' }),
      listPlatformAccounts: jest.fn(),
    };
    const service = new PlatformAccountService(repository as unknown as PenggunaRepository);

    await service.create({
      email: ' USER@FTI.TEST ',
      nama: ' Native User ',
      nip: ' 198001010000000001 ',
      pangkat: ' IV/a ',
      jabatan: ' Dosen ',
      nohp: '6281234567890',
    });

    expect(repository.createPlatformAccount).toHaveBeenCalledWith({
      email: 'user@fti.test',
      nama: 'Native User',
      nip: '198001010000000001',
      pangkat: 'IV/a',
      jabatan: 'Dosen',
      nohp: '6281234567890',
      kataSandi: 'hash',
    });
  });

  it('updates profile fields without accepting platformRole as an input', async () => {
    const repository = {
      findPlatformAccount: jest.fn().mockResolvedValue({
        penggunaId: 'u-1',
        email: 'old@fti.test',
        nip: '1',
        deletedAt: null,
      }),
      updatePlatformAccount: jest.fn().mockResolvedValue({ penggunaId: 'u-1' }),
      existsEmailOtherThan: jest.fn(),
      existsNipOtherThan: jest.fn(),
    };
    const service = new PlatformAccountService(repository as unknown as PenggunaRepository);

    await service.update('u-1', { nama: 'Updated User' });

    expect(repository.updatePlatformAccount).toHaveBeenCalledWith(
      'u-1',
      expect.objectContaining({ nama: 'Updated User', deletedAt: null }),
    );
    const updateMock = repository.updatePlatformAccount as unknown as {
      mock: { calls: unknown[][] };
    };
    const updateInput = updateMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(updateInput).not.toHaveProperty('platformRole');
  });

  it('rejects deactivation while the account still owns or holds active workflow authority', async () => {
    const repository = {
      findPlatformAccount: jest.fn().mockResolvedValue({
        penggunaId: 'u-1',
        email: 'owner@fti.test',
        nip: '1',
        deletedAt: null,
      }),
      existsEmailOtherThan: jest.fn(),
      existsNipOtherThan: jest.fn(),
      countActiveOwnedProcesses: jest.fn().mockResolvedValue(1),
      countActiveOwnerAuthorities: jest.fn().mockResolvedValue(0),
      countActiveOrganizationalAuthorities: jest.fn().mockResolvedValue(0),
      updatePlatformAccount: jest.fn(),
    };
    const service = new PlatformAccountService(repository as unknown as PenggunaRepository);

    await expect(service.update('u-1', { status: 'NONAKTIF' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.updatePlatformAccount).not.toHaveBeenCalled();
  });

  it('soft-deactivates an unassigned account and invalidates its sessions', async () => {
    const repository = {
      findPlatformAccount: jest.fn().mockResolvedValue({
        penggunaId: 'u-1',
        email: 'user@fti.test',
        nip: '1',
        deletedAt: null,
      }),
      existsEmailOtherThan: jest.fn(),
      existsNipOtherThan: jest.fn(),
      countActiveOwnedProcesses: jest.fn().mockResolvedValue(0),
      countActiveOwnerAuthorities: jest.fn().mockResolvedValue(0),
      countActiveOrganizationalAuthorities: jest.fn().mockResolvedValue(0),
      updatePlatformAccount: jest.fn().mockResolvedValue({ penggunaId: 'u-1' }),
    };
    const service = new PlatformAccountService(repository as unknown as PenggunaRepository);

    await service.update('u-1', { status: 'NONAKTIF' });

    expect(repository.updatePlatformAccount).toHaveBeenCalledWith(
      'u-1',
      expect.objectContaining({ invalidateSessions: true }),
    );
    const updateMock = repository.updatePlatformAccount as unknown as {
      mock: { calls: unknown[][] };
    };
    const updateInput = updateMock.mock.calls[0]?.[1] as {
      deletedAt?: unknown;
    };
    expect(updateInput.deletedAt).toBeInstanceOf(Date);
  });
});
