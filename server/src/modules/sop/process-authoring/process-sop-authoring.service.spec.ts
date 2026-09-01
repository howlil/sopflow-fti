import { StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { SopCatalogRepository, SopDaftarDbRow } from '../catalog/sop-catalog.repository';
import type { SopCatalogService } from '../catalog/sop-catalog.service';
import { ProcessSopAuthoringService } from './process-sop-authoring.service';

describe('ProcessSopAuthoringService', () => {
  it('does not leak a bound SOP through legacy same-OPD listing when Process access is absent', async () => {
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
      processSopBinding: {
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
    const catalogService = {
      listForCurrentUser: jest.fn().mockResolvedValue([
        {
          id: 'sop-target-inaccessible',
          opdId: 'opd-same',
          detailSopId: 'detail-inaccessible',
          judul: 'Should not leak',
          nomorSop: 'LEGACY/1',
          versi: 1,
          pembuat: 'User',
          terakhirDiedit: { nama: null, waktu: now.toISOString() },
          status: 'DRAFT',
          statusLabel: 'Draft',
          peraturanId: null,
          terakhirDiperbarui: now.toISOString(),
          versiBerlaku: null,
          canBuatVersiBaru: false,
          canCabutSop: false,
          canHapusSopDraft: true,
        },
        {
          id: 'sop-legacy-unbound',
          opdId: 'opd-same',
          detailSopId: 'detail-legacy',
          judul: 'Legacy remains visible',
          nomorSop: 'LEGACY/2',
          versi: 1,
          pembuat: 'User',
          terakhirDiedit: { nama: null, waktu: now.toISOString() },
          status: 'DRAFT',
          statusLabel: 'Draft',
          peraturanId: null,
          terakhirDiperbarui: now.toISOString(),
          versiBerlaku: null,
          canBuatVersiBaru: false,
          canCabutSop: false,
          canHapusSopDraft: true,
        },
      ]),
    } as unknown as SopCatalogService;

    const service = new ProcessSopAuthoringService(
      prisma,
      processContext,
      repository,
      catalogService,
    );

    const rows = await service.listForCurrentUser(
      { sub: 'user-1', email: 'u@example.test', peran: 'PENYUSUN', sesiTokenVersion: 1 },
      undefined,
    );

    expect(rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(['sop-legacy-unbound', 'sop-target-accessible']),
    );
    expect(rows.map((row) => row.id)).not.toContain('sop-target-inaccessible');
    expect(rows.find((row) => row.id === 'sop-target-accessible')).toMatchObject({
      processId: 'process-a',
      processNama: 'Tugas Akhir',
    });
  });
});
