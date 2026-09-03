import { PeranPengguna, StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { SopCatalogRepository, SopDaftarDbRow } from '../catalog/sop-catalog.repository';
import type { SopCatalogService } from '../catalog/sop-catalog.service';
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
    } as unknown as PrismaService;
    const processContext = {
      listForUser: jest.fn().mockResolvedValue([{ processId: 'process-a', nama: 'Tugas Akhir' }]),
    } as unknown as ProcessContextService;
    const repository = {
      findDaftarAll: jest.fn().mockResolvedValue([accessibleTarget]),
    } as unknown as SopCatalogRepository;
    const catalogService = {} as unknown as SopCatalogService;

    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService,
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
    } as unknown as SopCatalogService;
    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService,
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
    expect(catalogService.listForCurrentUser).not.toHaveBeenCalled();
  });
});
