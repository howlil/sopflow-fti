import { NotFoundException } from '@nestjs/common';
import { StatusSOP } from '../../../generated/prisma';
import type { SopWorkbenchDbPayload } from './sop-catalog.repository';
import { SopCatalogRepository } from './sop-catalog.repository';
import { SopCatalogService } from './sop-catalog.service';

describe('SopCatalogService', () => {
  const repository = {
    findWorkbenchPayloadByDetailOrSopId: jest.fn(),
  } as unknown as jest.Mocked<SopCatalogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createService(): SopCatalogService {
    return new SopCatalogService(repository);
  }

  function workbench(status: StatusSOP, processId: string | null = 'process-a'): SopWorkbenchDbPayload {
    const now = new Date('2026-09-06T00:00:00.000Z');
    return {
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      status,
      versi: 1,
      nomorSOP: 'SOP/001',
      tanggalPembuatan: now,
      tanggalRevisi: null,
      tanggalEfektif: status === StatusSOP.BERLAKU ? now : null,
      namaLembaga: 'Fakultas Teknologi Informasi',
      dibuatOlehId: 'user-1',
      terakhirDieditOlehId: null,
      revisiDariDetailSopId: null,
      revisiDari: null,
      createdAt: now,
      updatedAt: now,
      sop: {
        sopId: 'sop-1',
        opdId: null,
        processId,
        judul: 'SOP Native',
        createdAt: now,
        updatedAt: now,
        opd: null,
      },
      dibuatOleh: { penggunaId: 'user-1', nama: 'Pengguna' },
      terakhirDieditOleh: null,
      lampiranPeringatan: [],
      lampiranKualifikasiPelaksanaan: [],
      lampiranPeralatanPerlengkapan: [],
      lampiranPencatatanPendataan: [],
      dasarHukum: [],
      relasiSopKeluar: [],
      relasiSopMasuk: [],
      swimlanes: [],
      langkahSOP: [],
      logEditSop: [],
      dokumenTte: [],
      konfigurasiDiagram: [],
    } as unknown as SopWorkbenchDbPayload;
  }

  it('rejects a missing document', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(null);

    await expect(createService().getPublicDokumenBerlaku('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a non-effective document', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(workbench(StatusSOP.DRAFT));

    await expect(createService().getPublicDokumenBerlaku('detail-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects an effective legacy-unbound document from first-party public discovery', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(
      workbench(StatusSOP.BERLAKU, null),
    );

    await expect(createService().getPublicDokumenBerlaku('detail-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns only an effective Process-bound document', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(workbench(StatusSOP.BERLAKU));

    const result = await createService().getPublicDokumenBerlaku('detail-1');

    expect(repository.findWorkbenchPayloadByDetailOrSopId).toHaveBeenCalledWith('detail-1', 0);
    expect(result.detail.id).toBe('detail-1');
    expect(result.detail.sop).toMatchObject({ processId: 'process-a' });
    expect(result.langkah).toEqual([]);
  });
});
