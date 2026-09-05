import { ConflictException } from '@nestjs/common';
import { OrganizationalScope, PeranPengguna, StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { SopCatalogRepository, SopDaftarDbRow } from '../catalog/sop-catalog.repository';
import type { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

describe('ProcessSopAuthoringService', () => {
  it('lists only native SOPs for the user Process relationships', async () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    const accessibleTarget: SopDaftarDbRow = {
      sopId: 'sop-target-accessible',
      opdId: 'opd-other',
      judul: 'SOP Process TA',
      detail: {
        detailSopId: 'detail-target',
        nomorSOP: 'FTI/TA/001',
        status: StatusSOP.DRAFT,
        versi: 1,
        updatedAt: now,
        pembuatNama: 'Owner TA',
        editorNama: null,
        peraturanId: null,
      },
      versiBerlaku: null,
      allStatuses: [StatusSOP.DRAFT],
    };

    const prisma = {
      sOP: {
        findMany: jest.fn().mockResolvedValue([
          { sopId: 'sop-target-inaccessible', processId: 'process-b' },
          { sopId: 'sop-target-accessible', processId: 'process-a' },
        ]),
      },
      processFinalApproval: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationalAuthorityAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      pengguna: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;
    const processContext = {
      listForUser: jest.fn().mockResolvedValue([
        {
          processId: 'process-a',
          nama: 'Tugas Akhir',
          scope: OrganizationalScope.FACULTY,
          ownerId: 'owner-1',
          departmentId: null,
          owner: { nama: 'Process Owner' },
          department: null,
        },
      ]),
    } as unknown as ProcessContextService;
    const repository = {
      findDaftarAll: jest.fn().mockResolvedValue([accessibleTarget]),
    } as unknown as SopCatalogRepository;
    const catalogService = {};

    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService as unknown as SopWorkbenchReader,
    );

    const rows = await service.listForCurrentUser(
      {
        sub: 'user-1',
        email: 'u@example.test',
        peran: PeranPengguna.PENYUSUN,
        sesiTokenVersion: 1,
      },
      undefined,
    );

    expect(rows.map((row) => row.id)).toEqual(['sop-target-accessible']);
    expect(rows.map((row) => row.id)).not.toContain('sop-target-inaccessible');
    expect(rows.find((row) => row.id === 'sop-target-accessible')).toMatchObject({
      processId: 'process-a',
      processNama: 'Tugas Akhir',
      lifecycle: {
        stage: 'AUTHORING',
        stateLabel: 'Draft',
        responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      },
    });
  });

  it('does not expose legacy unbound SOPs to a non-authoring global role', async () => {
    const prisma = {
      sOP: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const processContext = {
      listForUser: jest.fn().mockResolvedValue([]),
    } as unknown as ProcessContextService;
    const repository = {
      findDaftarAll: jest.fn().mockResolvedValue([]),
    } as unknown as SopCatalogRepository;
    const catalogService = {
      listForCurrentUser: jest.fn(),
    };
    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService as unknown as SopWorkbenchReader,
    );

    const rows = await service.listForCurrentUser(
      {
        sub: 'evaluator-1',
        email: 'evaluator@example.test',
        peran: PeranPengguna.EVALUATOR,
        sesiTokenVersion: 1,
      },
      undefined,
    );

    expect(rows).toEqual([]);
    expect(catalogService.listForCurrentUser.mock.calls).toHaveLength(0);
  });

  it('rejects an unbound SOP on the native workbench endpoint', async () => {
    const prisma = {
      sOP: {
        findUnique: jest.fn().mockResolvedValue({ processId: null }),
      },
    } as unknown as PrismaService;
    const processContext = {} as unknown as ProcessContextService;
    const repository = {
      findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
        sopId: 'legacy-sop',
        detailSopId: 'legacy-detail',
      }),
    } as unknown as SopCatalogRepository;
    const catalogService = {
      getPenyusunWorkbench: jest.fn(),
      getForDetail: jest.fn(),
    };
    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService as unknown as SopWorkbenchReader,
    );

    await expect(
      service.getWorkbench(
        {
          sub: 'legacy-user',
          email: 'legacy@example.test',
          peran: PeranPengguna.PENYUSUN,
          sesiTokenVersion: 1,
        },
        'legacy-detail',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(catalogService.getPenyusunWorkbench.mock.calls).toHaveLength(0);
  });
});
