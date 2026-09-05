import { NotFoundException } from '@nestjs/common';
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
  let reader: SopWorkbenchReader;

  beforeEach(() => {
    repository = {
      findWorkbenchPayloadByDetailOrSopId: jest.fn(),
    };
    reader = new SopWorkbenchReader(repository as unknown as SopCatalogRepository);
    mapWorkbenchPayloadMock.mockReset();
  });

  it('uses the default log limit and maps the repository payload', async () => {
    const payload = { detailSopId: 'detail-1' } as unknown as SopWorkbenchDbPayload;
    const mapped = { detail: { id: 'detail-1' } } as never;
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(payload);
    mapWorkbenchPayloadMock.mockReturnValue(mapped);

    await expect(reader.getForDetail('detail-1')).resolves.toBe(mapped);
    expect(repository.findWorkbenchPayloadByDetailOrSopId).toHaveBeenCalledWith('detail-1', 100);
    expect(mapWorkbenchPayloadMock).toHaveBeenCalledWith(payload);
  });

  it('clamps an explicit log limit to the supported range', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(
      {} as unknown as SopWorkbenchDbPayload,
    );
    mapWorkbenchPayloadMock.mockReturnValue({} as never);

    await reader.getForDetail('detail-1', 999.9);

    expect(repository.findWorkbenchPayloadByDetailOrSopId).toHaveBeenCalledWith('detail-1', 500);
  });

  it('throws when the repository cannot resolve the detail or SOP id', async () => {
    repository.findWorkbenchPayloadByDetailOrSopId.mockResolvedValue(null);

    await expect(reader.getForDetail('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mapWorkbenchPayloadMock).not.toHaveBeenCalled();
  });
});
