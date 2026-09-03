import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProcessContextService } from '../../core/process/process-context.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import type { SopCatalogService } from '../catalog/sop-catalog.service';
import { ProcessVersionService } from './process-version.service';

const user = {
  sub: 'member-a',
  email: 'member@example.test',
  peran: 'USER',
  sesiTokenVersion: 1,
} as never;

describe('ProcessVersionService', () => {
  function setup(binding: { processId: string } | null = { processId: 'process-a' }) {
    const prisma = {
      sOP: { findUnique: jest.fn().mockResolvedValue(binding) },
    } as unknown as PrismaService;
    const processContext = {
      assertCanAuthor: jest.fn().mockResolvedValue({ processId: 'process-a', nama: 'Process A' }),
    } as unknown as ProcessContextService;
    const repository = {
      findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
        detailSopId: 'detail-v1',
        sopId: 'sop-a',
        processId: binding?.processId ?? null,
        sopOpdId: null,
      }),
      findLatestDetailStatusContext: jest.fn().mockResolvedValue({ detailSopId: 'detail-v1' }),
      cloneDetailSopFromSource: jest.fn().mockResolvedValue({
        ok: true,
        data: { detailSopId: 'detail-v2', versi: 2 },
      }),
      findRiwayatVersiBySopId: jest.fn().mockResolvedValue([
        {
          detailSopId: 'detail-v1',
          versi: 1,
          nomorSOP: 'SOP-001',
          status: 'BERLAKU',
          revisiDariDetailSopId: null,
          revisiDariVersi: null,
          updatedAt: new Date('2026-09-01T00:00:00.000Z'),
          canHapusDraft: false,
        },
      ]),
    } as unknown as SopCatalogRepository;
    const catalog = {
      buatVersiBaruDariSumber: jest.fn().mockResolvedValue({ detail: { id: 'legacy-v2' } }),
      getPenyusunWorkbenchForEvaluasiContext: jest.fn().mockResolvedValue({
        detail: { id: 'detail-v2', sop: { id: 'sop-a' } },
      }),
      getRiwayatVersi: jest.fn(),
    } as unknown as SopCatalogService;
    return {
      service: new ProcessVersionService(prisma, processContext, repository, catalog),
      processContext: processContext as any,
      repository: repository as any,
      catalog: catalog as any,
    };
  }

  it('uses Process relationship for a Process-bound version', async () => {
    const ctx = setup();
    const result = await ctx.service.createVersion(user, 'detail-v1');

    expect(ctx.processContext.assertCanAuthor).toHaveBeenCalledWith('member-a', 'process-a');
    expect(ctx.repository.cloneDetailSopFromSource).toHaveBeenCalledWith({
      sourceDetailSopId: 'detail-v1',
      penggunaId: 'member-a',
    });
    expect(ctx.catalog.buatVersiBaruDariSumber).not.toHaveBeenCalled();
    expect(result.detail.sop).toMatchObject({ processId: 'process-a', processNama: 'Process A' });
  });

  it('keeps unbound SOP on the legacy compatibility path', async () => {
    const ctx = setup(null);
    await ctx.service.createVersion(user, 'detail-v1');

    expect(ctx.catalog.buatVersiBaruDariSumber).toHaveBeenCalledWith(user, 'detail-v1', undefined);
    expect(ctx.processContext.assertCanAuthor).not.toHaveBeenCalled();
  });

  it('denies an unrelated Process actor before cloning', async () => {
    const ctx = setup();
    ctx.processContext.assertCanAuthor.mockRejectedValueOnce(
      new ForbiddenException('Akses ditolak: pengguna bukan Process Owner atau Process Member'),
    );

    await expect(ctx.service.createVersion(user, 'detail-v1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(ctx.repository.cloneDetailSopFromSource).not.toHaveBeenCalled();
  });

  it('reads native version history through Process authorization', async () => {
    const ctx = setup();

    await expect(ctx.service.getVersionHistory(user, 'sop-a')).resolves.toMatchObject([
      expect.objectContaining({ detailSopId: 'detail-v1', canBuatVersiBaru: true }),
    ]);
    expect(ctx.processContext.assertCanAuthor).toHaveBeenCalledWith('member-a', 'process-a');
    expect(ctx.repository.findRiwayatVersiBySopId).toHaveBeenCalledWith('sop-a');
    expect(ctx.catalog.getRiwayatVersi).not.toHaveBeenCalled();
  });
});
