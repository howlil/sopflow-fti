import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { PejabatBerwenang, LingkupOrganisasi } from '../../../generated/prisma';
import { PejabatBerwenangService } from './organizational-authority.service';

describe('PejabatBerwenangService', () => {
  it('resolves faculty scope to the active Dean assignment', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'process-a',
          nama: 'Keuangan',
          scope: LingkupOrganisasi.FACULTY,
          departemenId: null,
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'DEAN',
          authority: PejabatBerwenang.DEAN,
          departemenId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'dean-1', nama: 'Dean FTI' }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.resolveForProsesBisnis('process-a')).resolves.toMatchObject({
      authority: PejabatBerwenang.DEAN,
      holderId: 'dean-1',
      scope: LingkupOrganisasi.FACULTY,
    });
  });

  it('resolves department scope to that department head only', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'process-ti',
          nama: 'Tugas Akhir',
          scope: LingkupOrganisasi.DEPARTMENT,
          departemenId: 'dept-ti',
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'HEAD_OF_DEPARTMENT:dept-ti',
          authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
          departemenId: 'dept-ti',
          holderId: 'kadep-ti',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'kadep-ti', nama: 'Kadep TI' }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.resolveForProsesBisnis('process-ti')).resolves.toMatchObject({
      authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
      departemenId: 'dept-ti',
      holderId: 'kadep-ti',
    });
  });

  it('does not allow another user or SUPER_ADMIN identity to bypass the resolved holder', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          prosesBisnisId: 'process-a',
          nama: 'Keuangan',
          scope: LingkupOrganisasi.FACULTY,
          departemenId: null,
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'DEAN',
          authority: PejabatBerwenang.DEAN,
          departemenId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'dean-1', nama: 'Dean FTI' }),
      },
    } as unknown as PrismaService;
    const service = new PejabatBerwenangService(prisma);

    await expect(service.assertCanApprove('admin-1', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
