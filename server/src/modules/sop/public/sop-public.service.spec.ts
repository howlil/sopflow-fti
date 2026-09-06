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
    countProcessWithBerlakuSop: jest.fn(),
    findProcessWithBerlakuSop: jest.fn(),
    findProcessById: jest.fn(),
    countBerlakuSopByProcess: jest.fn(),
    findBerlakuSopByProcess: jest.fn(),
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
    processId: 'process-1',
    nama: 'Akademik',
    scope: 'FACULTY',
    departmentId: null,
    departmentName: null,
    jumlahSopBerlaku: 2,
  } as const;

  const sopRow = {
    detailSopId: 'detail-1',
    sopId: 'sop-1',
    judul: 'SOP Akademik',
    nomorSOP: 'SOP-001',
    versi: 1,
    tanggalEfektif: new Date('2026-09-01T00:00:00.000Z'),
    processId: 'process-1',
    processName: 'Akademik',
    scope: 'FACULTY',
    departmentId: null,
    departmentName: null,
  } as const;

  it('lists only Process-first public groups', async () => {
    repoMock.countProcessWithBerlakuSop.mockResolvedValue(1);
    repoMock.findProcessWithBerlakuSop.mockResolvedValue([processRow]);

    const result = await service.listProcess({ page: 1, limit: 10 } as PublicArsipQueryDto);

    expect(result.items).toEqual([processRow]);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('rejects an unknown Process', async () => {
    repoMock.findProcessById.mockResolvedValue(null);

    await expect(
      service.listSopByProcess('missing', { page: 1, limit: 10 } as PublicArsipQueryDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists effective SOPs inside one Process', async () => {
    repoMock.findProcessById.mockResolvedValue(processRow);
    repoMock.countBerlakuSopByProcess.mockResolvedValue(1);
    repoMock.findBerlakuSopByProcess.mockResolvedValue([sopRow]);

    const result = await service.listSopByProcess('process-1', {
      page: 1,
      limit: 10,
    } as PublicArsipQueryDto);

    expect(result.process.processId).toBe('process-1');
    expect(result.items[0]).toMatchObject({
      detailSopId: 'detail-1',
      processId: 'process-1',
      pdfUrl: '/sop/public/pdf/detail-1',
    });
  });

  it('lists global FTI SOPs without OPD fallback fields', async () => {
    repoMock.countFtiSopGlobal.mockResolvedValue(1);
    repoMock.findFtiSopGlobal.mockResolvedValue([sopRow]);

    const result = await service.listFtiSopGlobal({ page: 1, limit: 10 } as PublicArsipQueryDto);

    expect(result.items[0]).toMatchObject({
      processId: 'process-1',
      processName: 'Akademik',
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
