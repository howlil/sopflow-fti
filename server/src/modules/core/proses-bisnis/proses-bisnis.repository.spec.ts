import { LingkupOrganisasi, PejabatBerwenang } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { ProsesBisnisRepository } from './proses-bisnis.repository';

describe('ProsesBisnisRepository admin overview', () => {
  it('builds a compact readiness read model from platform and governance data', async () => {
    const prisma = {
      pengguna: {
        count: jest
          .fn()
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(8)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(6),
        findMany: jest.fn().mockResolvedValue([{ penggunaId: 'dean-1' }]),
      },
      departemen: {
        findMany: jest.fn().mockResolvedValue([
          { departemenId: 'dept-if', nama: 'Informatika' },
          { departemenId: 'dept-si', nama: 'Sistem Informasi' },
        ]),
      },
      prosesBisnis: {
        groupBy: jest.fn().mockResolvedValue([
          { lingkup: LingkupOrganisasi.FACULTY, _count: { _all: 1 } },
          { lingkup: LingkupOrganisasi.DEPARTMENT, _count: { _all: 2 } },
        ]),
      },
      kewenanganPenanggungJawabProsesBisnis: {
        groupBy: jest
          .fn()
          .mockResolvedValue([{ lingkup: LingkupOrganisasi.FACULTY, _count: { _all: 1 } }]),
      },
      penugasanPejabatBerwenang: {
        findMany: jest.fn().mockResolvedValue([
          { authority: PejabatBerwenang.DEAN, departemenId: null, holderId: 'dean-1' },
          {
            authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
            departemenId: 'dept-if',
            holderId: 'head-1',
          },
        ]),
      },
    } as unknown as PrismaService;

    const repository = new ProsesBisnisRepository(prisma);

    await expect(repository.getAdminOverview()).resolves.toEqual({
      accounts: { total: 10, active: 8, inactive: 2, workflowUsers: 6 },
      organization: {
        departemen: 2,
        prosesBisnis: 3,
        facultyProcesses: 1,
        departmentProcesses: 2,
      },
      ownerGovernance: {
        activeAssignments: 1,
        facultyScopes: 1,
        departmentScopes: 0,
      },
      finalApproval: {
        deanConfigured: true,
        departmentHeadsConfigured: 0,
        departmentsWithoutHead: [
          { departemenId: 'dept-if', nama: 'Informatika' },
          { departemenId: 'dept-si', nama: 'Sistem Informasi' },
        ],
      },
    });
  });
});
