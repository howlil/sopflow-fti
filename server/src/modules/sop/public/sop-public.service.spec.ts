import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import { SopPdfStorageService } from '../pdf/sop-pdf-storage.service';
import type { PublicArsipQueryDto } from './dto/public-arsip-query.dto';
import { SopPublicRepository } from './sop-public.repository';
import { SopPublicService } from './sop-public.service';

describe('SopPublicService', () => {
  let service: SopPublicService;
  const repoMock = {
    countProsesBisnisWithBerlakuSop: jest.fn(),
    findProsesBisnisWithBerlakuSop: jest.fn(),
    findProsesBisnisById: jest.fn(),
    countBerlakuSopByProsesBisnis: jest.fn(),
    findBerlakuSopByProsesBisnis: jest.fn(),
    countFtiSopGlobal: jest.fn(),
    findFtiSopGlobal: jest.fn(),
    findPublishedPdfByDetailSopId: jest.fn(),
  };
  const catalogMock = {
    getPublicDokumenBerlaku: jest.fn(),
  };
  const storageMock = {
    readPublishedPdf: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopPublicService,
        { provide: SopPublicRepository, useValue: repoMock },
        { provide: SopCatalogService, useValue: catalogMock },
        { provide: SopPdfStorageService, useValue: storageMock },
      ],
    }).compile();
    service = module.get(SopPublicService);
  });

  const processRow = {
    prosesBisnisId: 'process-1',
    nama: 'Akademik',
    lingkup: 'FACULTY',
    departemenId: null,
    namaDepartemen: null,
    jumlahSopBerlaku: 2,
  } as const;

  const sopRow = {
    detailSopId: 'detail-1',
    sopId: 'sop-1',
    judul: 'SOP Akademik',
    nomorSOP: 'SOP-001',
    versi: 1,
    tanggalEfektif: new Date('2026-09-01T00:00:00.000Z'),
    prosesBisnisId: 'process-1',
    namaProsesBisnis: 'Akademik',
    lingkup: 'FACULTY',
    departemenId: null,
    namaDepartemen: null,
  } as const;

  it('lists only Proses Bisnis-first public groups', async () => {
    repoMock.countProsesBisnisWithBerlakuSop.mockResolvedValue(1);
    repoMock.findProsesBisnisWithBerlakuSop.mockResolvedValue([processRow]);

    const result = await service.listProsesBisnis({ page: 1, limit: 10 } as PublicArsipQueryDto);

    expect(result.items).toEqual([processRow]);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('rejects an unknown Proses Bisnis', async () => {
    repoMock.findProsesBisnisById.mockResolvedValue(null);

    await expect(
      service.listSopByProsesBisnis('missing', { page: 1, limit: 10 } as PublicArsipQueryDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists effective SOPs inside one Proses Bisnis', async () => {
    repoMock.findProsesBisnisById.mockResolvedValue(processRow);
    repoMock.countBerlakuSopByProsesBisnis.mockResolvedValue(1);
    repoMock.findBerlakuSopByProsesBisnis.mockResolvedValue([sopRow]);

    const result = await service.listSopByProsesBisnis('process-1', {
      page: 1,
      limit: 10,
    } as PublicArsipQueryDto);

    expect(result.prosesBisnis.prosesBisnisId).toBe('process-1');
    expect(result.items[0]).toMatchObject({
      detailSopId: 'detail-1',
      prosesBisnisId: 'process-1',
      pdfUrl: '/sop/public/pdf/detail-1',
    });
  });

  it('lists global FTI SOPs without OPD fallback fields', async () => {
    repoMock.countFtiSopGlobal.mockResolvedValue(1);
    repoMock.findFtiSopGlobal.mockResolvedValue([sopRow]);

    const result = await service.listFtiSopGlobal({ page: 1, limit: 10 } as PublicArsipQueryDto);

    expect(result.items[0]).toMatchObject({
      prosesBisnisId: 'process-1',
      namaProsesBisnis: 'Akademik',
      tanggalEfektif: '2026-09-01T00:00:00.000Z',
    });
    expect(result.items[0]).not.toHaveProperty('opdId');
    expect(result.items[0]).not.toHaveProperty('opdNama');
  });

  it('delegates effective document projection to the read-only catalog', async () => {
    const document = { detail: { id: 'detail-1' }, langkah: [] };
    catalogMock.getPublicDokumenBerlaku.mockResolvedValue(document);

    await expect(service.getDokumen('detail-1')).resolves.toBe(document);
    expect(catalogMock.getPublicDokumenBerlaku).toHaveBeenCalledWith('detail-1');
  });

  it('returns the official published PDF', async () => {
    repoMock.findPublishedPdfByDetailSopId.mockResolvedValue({
      pdfPath: '/data/sop.pdf',
      nomorSOP: 'SOP/001',
      versi: 2,
    });
    storageMock.readPublishedPdf.mockResolvedValue({ buffer: Buffer.from('pdf'), sizeBytes: 3 });

    const result = await service.getPublishedPdf('detail-1');

    expect(result.sizeBytes).toBe(3);
    expect(result.filename).toBe('SOP-SOP-001-v2.pdf');
  });

  it('returns Gone when an official PDF is no longer publishable', async () => {
    repoMock.findPublishedPdfByDetailSopId.mockResolvedValue(null);

    await expect(service.getPublishedPdf('detail-1')).rejects.toBeInstanceOf(GoneException);
  });
});
