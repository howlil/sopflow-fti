import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { OrganizationalScope } from '../../../generated/prisma';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import { SopPdfStorageService } from '../pdf/sop-pdf-storage.service';
import type { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import { SopPublicRepository } from './sop-public.repository';
import { SopPublicService } from './sop-public.service';

describe('SopPublicService — FTI-native archive', () => {
  let service: SopPublicService;
  const repo = {
    countProcessWithBerlakuSop: jest.fn(),
    findProcessWithBerlakuSop: jest.fn(),
    findProcessById: jest.fn(),
    countBerlakuSopByProcess: jest.fn(),
    findBerlakuSopByProcess: jest.fn(),
    countFtiSopGlobal: jest.fn(),
    findFtiSopGlobal: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopPublicService,
        { provide: SopPublicRepository, useValue: repo },
        { provide: SopCatalogService, useValue: {} },
        { provide: SopPdfStorageService, useValue: {} },
      ],
    }).compile();
    service = module.get(SopPublicService);
  });

  it('J35 memetakan Process Fakultas/Departemen yang memiliki SOP resmi', async () => {
    repo.countProcessWithBerlakuSop.mockResolvedValue(2);
    repo.findProcessWithBerlakuSop.mockResolvedValue([
      {
        processId: 'process-faculty',
        nama: 'Pengelolaan Akademik FTI',
        scope: OrganizationalScope.FACULTY,
        departmentId: null,
        departmentName: null,
        jumlahSopBerlaku: 2,
      },
      {
        processId: 'process-dept',
        nama: 'Pengelolaan Tugas Akhir',
        scope: OrganizationalScope.DEPARTMENT,
        departmentId: 'department-if',
        departmentName: 'Informatika',
        jumlahSopBerlaku: 1,
      },
    ]);

    const actual = await service.listProcess({ page: 1, limit: 50 } as PublicArsipQueryDto);

    expect(actual.pagination.totalItems).toBe(2);
    expect(actual.items).toEqual([
      expect.objectContaining({ processId: 'process-faculty', scope: OrganizationalScope.FACULTY }),
      expect.objectContaining({
        processId: 'process-dept',
        scope: OrganizationalScope.DEPARTMENT,
        departmentName: 'Informatika',
      }),
    ]);
  });

  it('J35 menggunakan Process context dan official PDF action pada SOP Process', async () => {
    repo.findProcessById.mockResolvedValue({
      processId: 'process-faculty',
      nama: 'Pengelolaan Akademik FTI',
      scope: OrganizationalScope.FACULTY,
      departmentId: null,
      departmentName: null,
      jumlahSopBerlaku: 1,
    });
    repo.countBerlakuSopByProcess.mockResolvedValue(1);
    repo.findBerlakuSopByProcess.mockResolvedValue([
      {
        detailSopId: 'detail-1',
        sopId: 'sop-1',
        opdId: 'legacy-opd',
        judul: 'SOP Akademik',
        nomorSOP: 'FTI-001',
        versi: 3,
        tanggalEfektif: new Date('2026-09-03T00:00:00.000Z'),
        opdNama: 'Legacy OPD',
        pdfPath: 'official.pdf',
        processId: 'process-faculty',
        processName: 'Pengelolaan Akademik FTI',
        scope: OrganizationalScope.FACULTY,
        departmentId: null,
        departmentName: null,
      },
    ]);

    const actual = await service.listSopByProcess('process-faculty', {
      page: 1,
      limit: 15,
    } as PublicArsipQueryDto);

    expect(actual.items[0]).toEqual(
      expect.objectContaining({
        detailSopId: 'detail-1',
        processId: 'process-faculty',
        processName: 'Pengelolaan Akademik FTI',
        pdfUrl: '/sop/public/pdf/detail-1',
      }),
    );
  });

  it('J35 menolak Process yang tidak ada', async () => {
    repo.findProcessById.mockResolvedValue(null);
    await expect(
      service.listSopByProcess('missing', { page: 1, limit: 15 } as PublicArsipQueryDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('J38 mempertahankan nullable Process context untuk legacy-unbound compatibility result', async () => {
    repo.countFtiSopGlobal.mockResolvedValue(1);
    repo.findFtiSopGlobal.mockResolvedValue([
      {
        detailSopId: 'legacy-detail',
        sopId: 'legacy-sop',
        opdId: 'legacy-opd',
        judul: 'SOP Legacy',
        nomorSOP: 'LEG-001',
        versi: 1,
        tanggalEfektif: null,
        opdNama: 'Legacy OPD',
        pdfPath: 'legacy.pdf',
        processId: null,
        processName: null,
        scope: null,
        departmentId: null,
        departmentName: null,
      },
    ]);

    const actual = await service.listFtiSopGlobal({
      page: 1,
      limit: 15,
      search: 'Legacy',
    } as PublicArsipQueryDto);

    expect(actual.items).toHaveLength(1);
    expect(actual.items[0]).toEqual(
      expect.objectContaining({
        detailSopId: 'legacy-detail',
        processId: null,
        processName: null,
        opdNama: 'Legacy OPD',
      }),
    );
  });
});
