import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { SopWorkbenchDbPayload, SopCatalogRepository } from './sop-catalog.repository';
import { mapWorkbenchPayload } from './sop-catalog.mapper';
import { SopWorkbenchReader } from './sop-workbench-reader.service';

jest.mock('./sop-catalog.mapper', () => ({
  mapWorkbenchPayload: jest.fn(),
}));

describe('SopWorkbenchReader', () => {
  const mapWorkbenchPayloadMock = mapWorkbenchPayload as jest.MockedFunction<
    typeof mapWorkbenchPayload
  >;
  let repository: jest.Mocked<Pick<SopCatalogRepository, 'findWorkbenchPayloadByDetailOrSopId'>>;
  let prisma: PrismaService;
  let reader: SopWorkbenchReader;

  beforeEach(() => {
    repository = {
      findWorkbenchPayloadByDetailOrSopId: jest.fn(),
    };
    prisma = {
      prosesBisnis: { findUnique: jest.fn().mockResolvedValue(null) },
      penugasanPejabatBerwenang: { findUnique: jest.fn() },
      pengguna: { findFirst: jest.fn() },
    } as unknown as PrismaService;
    reader = new SopWorkbenchReader(repository as unknown as SopCatalogRepository, prisma);
    mapWorkbenchPayloadMock.mockReset();
  });

  function currentPayload(): SopWorkbenchDbPayload {
    return {
      detailSopId: 'detail-1',
      sop: { prosesBisnisId: 'process-1' },
    } as unknown as SopWorkbenchDbPayload;
  }

  it('maps the repository payload', async () => {
    const payload = currentPayload();
    const mapped = { detail: { id: 'detail-1' } } as never;
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(payload);
    mapWorkbenchPayloadMock.mockReturnValue(mapped);

    await expect(reader.getForDetail('detail-1')).resolves.toBe(mapped);
    expect(repository.findWorkbenchPayloadByDetailOrSopId).toHaveBeenCalledWith('detail-1');
    expect(mapWorkbenchPayloadMock).toHaveBeenCalledWith(payload);
  });

  it('throws when the repository cannot resolve the detail or SOP id', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(null);

    await expect(reader.getForDetail('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mapWorkbenchPayloadMock).not.toHaveBeenCalled();
  });
});
