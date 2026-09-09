import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PejabatBerwenang, LingkupOrganisasi, PlatformRole } from '../../../generated/prisma';
import { PejabatBerwenangService } from './pejabat-berwenang.service';

describe('PejabatBerwenangService', () => {
  it('resolves faculty lingkup to the active Dean assignment', async () => {
    const prisma = {
      prosesBisnis: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'prosesBisnis-a',
          nama: 'Keuangan',
          lingkup: LingkupOrganisasi.FACULTY,
          departemenId: null,
        }),
      },
      penugasanPejabatBerwenang: {
        findUnique: jest.fn().mockResolvedValue({
          kunciPejabatBerwenang: 'DEAN',
          authority: PejabatBerwenang.DEAN,
          departemenId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({
          penggunaId: 'dean-1',
          nama: 'Dean FTI',
          platformRole: PlatformRole.USER,
        }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.resolveForProsesBisnis('prosesBisnis-a')).resolves.toMatchObject({
      authority: PejabatBerwenang.DEAN,
      holderId: 'dean-1',
      lingkup: LingkupOrganisasi.FACULTY,
    });
  });

  it('resolves department lingkup to that department head only', async () => {
    const prisma = {
      prosesBisnis: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'prosesBisnis-ti',
          nama: 'Tugas Akhir',
          lingkup: LingkupOrganisasi.DEPARTMENT,
          departemenId: 'dept-ti',
        }),
      },
      penugasanPejabatBerwenang: {
        findUnique: jest.fn().mockResolvedValue({
          kunciPejabatBerwenang: 'HEAD_OF_DEPARTMENT:dept-ti',
          authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
          departemenId: 'dept-ti',
          holderId: 'kadep-ti',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({
          penggunaId: 'kadep-ti',
          nama: 'Kadep TI',
          platformRole: PlatformRole.USER,
        }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.resolveForProsesBisnis('prosesBisnis-ti')).resolves.toMatchObject({
      authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
      departemenId: 'dept-ti',
      holderId: 'kadep-ti',
    });
  });

  it('does not allow another user or SUPER_ADMIN identity to bypass the resolved holder', async () => {
    const prisma = {
      prosesBisnis: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'prosesBisnis-a',
          nama: 'Keuangan',
          lingkup: LingkupOrganisasi.FACULTY,
          departemenId: null,
        }),
      },
      penugasanPejabatBerwenang: {
        findUnique: jest.fn().mockResolvedValue({
          kunciPejabatBerwenang: 'DEAN',
          authority: PejabatBerwenang.DEAN,
          departemenId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({
          penggunaId: 'dean-1',
          nama: 'Dean FTI',
          platformRole: PlatformRole.USER,
        }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.assertCanApprove('admin-1', 'prosesBisnis-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not allow SUPER_ADMIN to become a workflow authority holder', async () => {
    const upsert = jest.fn();
    const prisma = {
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ platformRole: PlatformRole.SUPER_ADMIN }),
      },
      penugasanPejabatBerwenang: { upsert },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.assignDean('admin-1')).rejects.toBeInstanceOf(ConflictException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
