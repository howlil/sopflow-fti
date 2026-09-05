import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PeranPengguna, StatusSOP } from '../../../generated/prisma';
import type { JwtAccessPayload } from '../../../common';
import type { SopWorkbenchDbPayload } from './sop-catalog.repository';
import { SopCatalogRepository } from './sop-catalog.repository';
import { SopCatalogService } from './sop-catalog.service';
import { SopLegacyAccessPolicy } from './sop-legacy-access.policy';
import { SopLegacyVersionCompatibilityService } from './sop-legacy-version-compatibility.service';

describe('SopCatalogService', () => {
  const repository = {
    findWorkbenchPayloadByDetailOrSopId: jest.fn(),
  } as unknown as jest.Mocked<SopCatalogRepository>;
  const accessPolicy = {
    assertWorkbenchAccess: jest.fn(),
  } as unknown as jest.Mocked<SopLegacyAccessPolicy>;
  const legacyVersionCompatibility = {} as SopLegacyVersionCompatibilityService;
  const user: JwtAccessPayload = {
    sub: 'user-1',
    email: 'user@example.test',
    peran: PeranPengguna.PENYUSUN,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accessPolicy.assertWorkbenchAccess.mockResolvedValue(undefined);
  });

  function createService(): SopCatalogService {
    return new SopCatalogService(repository, accessPolicy, legacyVersionCompatibility);
  }

  function workbench(status: StatusSOP): SopWorkbenchDbPayload {
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
      namaLembaga: 'Lembaga',
      dibuatOlehId: 'user-1',
      terakhirDieditOlehId: null,
      revisiDariDetailSopId: null,
      revisiDari: null,
      createdAt: now,
      updatedAt: now,
      sop: {
        sopId: 'sop-1',
        opdId: 'opd-1',
        judul: 'SOP Native',
        createdAt: now,
        updatedAt: now,
        opd: { opdId: 'opd-1', nama: 'OPD', pengguna: [] },
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
    } as unknown as SopWorkbenchDbPayload;
  }

  it('rejects a missing workbench', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(null);

    await expect(createService().getPenyusunWorkbench(user, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a workbench without a native OPD boundary', async () => {
    const row = workbench(StatusSOP.DRAFT);
    row.sop.opdId = null;
    row.sop.opd = null;
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(row);

    await expect(createService().getPenyusunWorkbench(user, 'detail-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(accessPolicy.assertWorkbenchAccess).not.toHaveBeenCalled();
  });

  it('uses the native access boundary for a workbench', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(workbench(StatusSOP.DRAFT));

    const result = await createService().getPenyusunWorkbench(user, 'detail-1');

    expect(accessPolicy.assertWorkbenchAccess).toHaveBeenCalledWith(user, 'opd-1');
    expect(result.detail.id).toBe('detail-1');
  });

  it('exposes only an effective document through the public archive', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(workbench(StatusSOP.BERLAKU));

    const result = await createService().getPublicDokumenBerlaku('detail-1');

    expect(result.detail.id).toBe('detail-1');
    expect(result.opd).toEqual({ id: 'opd-1', nama: 'OPD' });
    expect(accessPolicy.assertWorkbenchAccess).not.toHaveBeenCalled();
  });
});
