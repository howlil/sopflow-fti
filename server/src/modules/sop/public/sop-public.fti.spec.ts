import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { LingkupOrganisasi } from '../../../generated/prisma';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import { SopPdfStorageService } from '../pdf/sop-pdf-storage.service';
import type { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import { SopPublicRepository } from './sop-public.repository';
import { SopPublicService } from './sop-public.service';

describe('SopPublicService — FTI-native archive', () => {
  let service: SopPublicService;
  const repo = {
    countProsesBisnisWithBerlakuSop: jest.fn(),
    findProsesBisnisWithBerlakuSop: jest.fn(),
    findProsesBisnisById: jest.fn(),
    countBerlakuSopByProsesBisnis: jest.fn(),
    findBerlakuSopByProsesBisnis: jest.fn(),
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

  it('J35 memetakan Proses Bisnis Fakultas/Departemen yang memiliki SOP resmi', async () => {
    repo.countProsesBisnisWithBerlakuSop.mockResolvedValue(2);
    repo.findProsesBisnisWithBerlakuSop.mockResolvedValue([
      {
        prosesBisnisId: 'process-faculty',
        nama: 'Pengelolaan Akademik FTI',
        scope: LingkupOrganisasi.FACULTY,
        departemenId: null,
        namaDepartemen: null,
        jumlahSopBerlaku: 2,
      },
      {
        prosesBisnisId: 'process-dept',
        nama: 'Pengelolaan Tugas Akhir',
        scope: LingkupOrganisasi.DEPARTMENT,
        departemenId: 'department-if',
        namaDepartemen: 'Informatika',
        jumlahSopBerlaku: 1,
      },
    ]);

    const actual = await service.listProsesBisnis({ page: 1, limit: 50 } as PublicArsipQueryDto);

    expect(actual.pagination.totalItems).toBe(2);
    expect(actual.items).toEqual([
      expect.objectContaining({ prosesBisnisId: 'process-faculty', scope: LingkupOrganisasi.FACULTY }),
      expect.objectContaining({
        prosesBisnisId: 'process-dept',
        scope: LingkupOrganisasi.DEPARTMENT,
        namaDepartemen: 'Informatika',
      }),
    ]);
  });

  it('J35 menggunakan Proses Bisnis context dan official PDF action pada SOP Proses Bisnis', async () => {
    repo.findProsesBisnisById.mockResolvedValue({
      prosesBisnisId: 'process-faculty',
      nama: 'Pengelolaan Akademik FTI',
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
      namaDepartemen: null,
      jumlahSopBerlaku: 1,
    });
    repo.countBerlakuSopByProsesBisnis.mockResolvedValue(1);
    repo.findBerlakuSopByProsesBisnis.mockResolvedValue([
      {
        detailSopId: 'detail-1',
        sopId: 'sop-1',
        judul: 'SOP Akademik',
        nomorSOP: 'FTI-001',
        versi: 3,
        tanggalEfektif: new Date('2026-09-03T00:00:00.000Z'),
        opdNama: 'Legacy OPD',
        pdfPath: 'official.pdf',
        prosesBisnisId: 'process-faculty',
        namaProsesBisnis: 'Pengelolaan Akademik FTI',
        scope: LingkupOrganisasi.FACULTY,
        departemenId: null,
        namaDepartemen: null,
      },
    ]);

    const actual = await service.listSopByProsesBisnis('process-faculty', {
      page: 1,
      limit: 15,
    } as PublicArsipQueryDto);

    expect(actual.items[0]).toEqual(
      expect.objectContaining({
        detailSopId: 'detail-1',
        prosesBisnisId: 'process-faculty',
        namaProsesBisnis: 'Pengelolaan Akademik FTI',
        pdfUrl: '/sop/public/pdf/detail-1',
      }),
    );
  });

  it('J35 menolak Proses Bisnis yang tidak ada', async () => {
    repo.findProsesBisnisById.mockResolvedValue(null);
    await expect(
      service.listSopByProsesBisnis('missing', { page: 1, limit: 15 } as PublicArsipQueryDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('J38 mempertahankan nullable Proses Bisnis context untuk legacy-unbound compatibility result', async () => {
    repo.countFtiSopGlobal.mockResolvedValue(1);
    repo.findFtiSopGlobal.mockResolvedValue([
      {
        detailSopId: 'legacy-detail',
        sopId: 'legacy-sop',
        judul: 'SOP Legacy',
        nomorSOP: 'LEG-001',
        versi: 1,
        tanggalEfektif: null,
        opdNama: 'Legacy OPD',
        pdfPath: 'legacy.pdf',
        prosesBisnisId: null,
        namaProsesBisnis: null,
        scope: null,
        departemenId: null,
        namaDepartemen: null,
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
        prosesBisnisId: null,
        namaProsesBisnis: null,
        opdNama: 'Legacy OPD',
      }),
    );
  });
});
