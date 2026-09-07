import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { StatusSOP } from '../../../generated/prisma';
import type { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import type { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import { ProsesBisnisVersionService } from './versi-sop-proses-bisnis.service';

const user = {
  sub: 'anggota-a',
  email: 'anggota@example.test',
  sesiTokenVersion: 1,
} as const;

describe('ProsesBisnisVersionService', () => {
  function setup(binding: { prosesBisnisId: string | null } | null = { prosesBisnisId: 'prosesBisnis-a' }) {
    const prisma = {
      sOP: { findUnique: jest.fn().mockResolvedValue(binding) },
    } as unknown as PrismaService;
    const processContext = {
      assertCanAuthor: jest.fn().mockResolvedValue({ prosesBisnisId: 'prosesBisnis-a', nama: 'Proses Bisnis A' }),
    } as unknown as ProsesBisnisContextService;
    const repository = {
      findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
        detailSopId: 'detail-v1',
        sopId: 'sop-a',
        prosesBisnisId: binding?.prosesBisnisId ?? null,
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
          status: StatusSOP.EFFECTIVE,
          revisiDariDetailSopId: null,
          revisiDariVersi: null,
          updatedAt: new Date('2026-09-01T00:00:00.000Z'),
          canHapusDraft: false,
        },
      ]),
    } as unknown as SopCatalogRepository;
    const workbenchReader = {
      getForDetail: jest.fn().mockResolvedValue({
        detail: { id: 'detail-v2', sop: { id: 'sop-a' } },
      }),
    } as unknown as SopWorkbenchReader;
    return {
      service: new ProsesBisnisVersionService(prisma, processContext, repository, workbenchReader),
      processContext: processContext as any,
      repository: repository as any,
      workbenchReader: workbenchReader as any,
    };
  }

  it('uses Proses Bisnis relationship for a Proses Bisnis-bound version', async () => {
    const ctx = setup();
    const result = await ctx.service.createVersion(user, 'detail-v1');

    expect(ctx.processContext.assertCanAuthor).toHaveBeenCalledWith('anggota-a', 'prosesBisnis-a');
    expect(ctx.repository.cloneDetailSopFromSource).toHaveBeenCalledWith({
      sourceDetailSopId: 'detail-v1',
      penggunaId: 'anggota-a',
    });
    expect(ctx.workbenchReader.getForDetail).toHaveBeenCalledWith('detail-v2', undefined);
    expect(result.detail.sop).toMatchObject({ prosesBisnisId: 'prosesBisnis-a', namaProsesBisnis: 'Proses Bisnis A' });
  });

  it('rejects an SOP without native Penanggung Jawab kepemilikan Proses Bisnis', async () => {
    const ctx = setup({ prosesBisnisId: null });

    await expect(ctx.service.createVersion(user, 'detail-v1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ctx.processContext.assertCanAuthor).not.toHaveBeenCalled();
    expect(ctx.repository.cloneDetailSopFromSource).not.toHaveBeenCalled();
  });

  it('denies an unrelated Proses Bisnis actor before cloning', async () => {
    const ctx = setup();
    ctx.processContext.assertCanAuthor.mockRejectedValueOnce(
      new ForbiddenException('Akses ditolak: pengguna bukan Penanggung Jawab Proses Bisnis atau Anggota Proses Bisnis'),
    );

    await expect(ctx.service.createVersion(user, 'detail-v1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(ctx.repository.cloneDetailSopFromSource).not.toHaveBeenCalled();
  });

  it('reads native version history through Proses Bisnis authorization', async () => {
    const ctx = setup();

    await expect(ctx.service.getVersionHistory(user, 'sop-a')).resolves.toMatchObject([
      expect.objectContaining({
        detailSopId: 'detail-v1',
        status: StatusSOP.EFFECTIVE,
        canBuatVersiBaru: true,
      }),
    ]);
    expect(ctx.processContext.assertCanAuthor).toHaveBeenCalledWith('anggota-a', 'prosesBisnis-a');
    expect(ctx.repository.findRiwayatVersiBySopId).toHaveBeenCalledWith('sop-a');
  });

  it('rejects version history for an SOP without Penanggung Jawab kepemilikan Proses Bisnis', async () => {
    const ctx = setup({ prosesBisnisId: null });

    await expect(ctx.service.getVersionHistory(user, 'sop-a')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(ctx.processContext.assertCanAuthor).not.toHaveBeenCalled();
  });
});
