import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { OrganizationalAuthority, OrganizationalScope } from '../../../generated/prisma';
import { OrganizationalAuthorityService } from './organizational-authority.service';

describe('OrganizationalAuthorityService', () => {
  it('resolves faculty scope to the active Dean assignment', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          processId: 'process-a',
          nama: 'Keuangan',
          scope: OrganizationalScope.FACULTY,
          departmentId: null,
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'DEAN',
          authority: OrganizationalAuthority.DEAN,
          departmentId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'dean-1', nama: 'Dean FTI' }),
      },
    } as unknown as PrismaService;
    const service = new OrganizationalAuthorityService(prisma);

    await expect(service.resolveForProcess('process-a')).resolves.toMatchObject({
      authority: OrganizationalAuthority.DEAN,
      holderId: 'dean-1',
      scope: OrganizationalScope.FACULTY,
    });
  });

  it('resolves department scope to that department head only', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          processId: 'process-ti',
          nama: 'Tugas Akhir',
          scope: OrganizationalScope.DEPARTMENT,
          departmentId: 'dept-ti',
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'HEAD_OF_DEPARTMENT:dept-ti',
          authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
          departmentId: 'dept-ti',
          holderId: 'kadep-ti',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'kadep-ti', nama: 'Kadep TI' }),
      },
    } as unknown as PrismaService;
    const service = new OrganizationalAuthorityService(prisma);

    await expect(service.resolveForProcess('process-ti')).resolves.toMatchObject({
      authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
      departmentId: 'dept-ti',
      holderId: 'kadep-ti',
    });
  });

  it('does not allow another user or SUPER_ADMIN identity to bypass the resolved holder', async () => {
    const prisma = {
      process: {
        findUnique: jest.fn().mockResolvedValue({
          processId: 'process-a',
          nama: 'Keuangan',
          scope: OrganizationalScope.FACULTY,
          departmentId: null,
        }),
      },
      organizationalAuthorityAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          authorityKey: 'DEAN',
          authority: OrganizationalAuthority.DEAN,
          departmentId: null,
          holderId: 'dean-1',
        }),
      },
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({ penggunaId: 'dean-1', nama: 'Dean FTI' }),
      },
    } as unknown as PrismaService;
    const service = new OrganizationalAuthorityService(prisma);

    await expect(service.assertCanApprove('admin-1', 'process-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
