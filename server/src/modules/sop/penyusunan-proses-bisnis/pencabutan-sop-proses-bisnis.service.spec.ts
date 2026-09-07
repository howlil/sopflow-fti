import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  PejabatBerwenang,
  LingkupOrganisasi,
  JenisNotifikasiProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import type { PejabatBerwenangService } from '../../core/proses-bisnis/pejabat-berwenang.service';
import type { NotifikasiProsesBisnisService } from '../../notifications/proses-bisnis/notifikasi-proses-bisnis.service';
import type { SopCatalogRepository } from '../catalog/sop-catalog.repository';
import { ProsesBisnisSopRevocationService } from './pencabutan-sop-proses-bisnis.service';

const user = { sub: 'dean-1', email: 'dean@example.test' } as const;

function makeService(options?: { transitionCount?: number }) {
  const tx = {
    detailSOP: {
      updateMany: jest.fn().mockResolvedValue({ count: options?.transitionCount ?? 1 }),
    },
    logEditSOP: {
      create: jest.fn().mockResolvedValue({}),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
  const prisma = {
    prosesBisnis: {
      findMany: jest.fn().mockResolvedValue([
        {
          prosesBisnisId: 'prosesBisnis-a',
          nama: 'Proses Bisnis Fakultas',
          lingkup: LingkupOrganisasi.FACULTY,
          departemenId: null,
          departemen: null,
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({ penanggungJawabId: 'owner-1', nama: 'Proses Bisnis Fakultas' }),
    },
    sOP: {
      findMany: jest.fn().mockResolvedValue([{ sopId: 'sop-a', prosesBisnisId: 'prosesBisnis-a' }]),
      findUnique: jest.fn().mockResolvedValue({ prosesBisnisId: 'prosesBisnis-a' }),
    },
    detailSOP: {
      findMany: jest.fn().mockResolvedValue([
        {
          detailSopId: 'detail-a',
          sopId: 'sop-a',
          nomorSOP: 'SOP-001',
          status: StatusSOP.EFFECTIVE,
          versi: 1,
          updatedAt: new Date('2026-09-03T00:00:00.000Z'),
          sop: { judul: 'SOP Fakultas' },
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({ dibuatOlehId: 'author-1' }),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;
  const authority = {
    listMine: jest.fn().mockResolvedValue([
      {
        kunciPejabatBerwenang: 'DEAN',
        authority: PejabatBerwenang.DEAN,
        departemenId: null,
        holderId: 'dean-1',
      },
    ]),
    assertCanApprove: jest.fn().mockResolvedValue({
      authority: PejabatBerwenang.DEAN,
      kunciPejabatBerwenang: 'DEAN',
      holderId: 'dean-1',
    }),
  } as unknown as PejabatBerwenangService;
  const notifikasiProsesBisnis = {
    createManyInTransaction: jest.fn().mockResolvedValue(['author-1', 'owner-1']),
    emitChangedMany: jest.fn(),
  } as unknown as NotifikasiProsesBisnisService;
  const catalog = {
    findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
    }),
    findRiwayatVersiBySopId: jest.fn().mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.EFFECTIVE },
    ]),
  } as unknown as SopCatalogRepository;
  return {
    service: new ProsesBisnisSopRevocationService(prisma, authority, notifikasiProsesBisnis, catalog),
    prisma,
    authority,
    notifikasiProsesBisnis,
    catalog,
    tx,
  };
}

describe('ProsesBisnisSopRevocationService', () => {
  it('lists only effective Proses Bisnis SOPs in the current pejabat berwenang lingkup', async () => {
    const { service } = makeService();

    await expect(service.listForCurrentAuthority(user)).resolves.toEqual([
      expect.objectContaining({
        detailSopId: 'detail-a',
        prosesBisnisId: 'prosesBisnis-a',
        lingkup: LingkupOrganisasi.FACULTY,
        judul: 'SOP Fakultas',
      }),
    ]);
  });

  it('revokes BERLAKU and persists author/Penanggung Jawab Proses Bisnis feedback inside the same transaction', async () => {
    const { service, authority, notifikasiProsesBisnis, tx } = makeService();

    await expect(service.revoke(user, 'detail-a')).resolves.toEqual({
      detailSopId: 'detail-a',
      sopId: 'sop-a',
      prosesBisnisId: 'prosesBisnis-a',
      status: StatusSOP.REVOKED,
    });
    expect(authority.assertCanApprove).toHaveBeenCalledWith('dean-1', 'prosesBisnis-a');
    expect(tx.detailSOP.updateMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-a', status: StatusSOP.EFFECTIVE },
      data: { status: StatusSOP.REVOKED, terakhirDieditOlehId: 'dean-1' },
    });
    expect(tx.logEditSOP.create).toHaveBeenCalled();
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(notifikasiProsesBisnis.createManyInTransaction).toHaveBeenCalledWith(
      tx,
      expect.arrayContaining([
        expect.objectContaining({
          penggunaId: 'author-1',
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED,
          namaProsesBisnis: 'Proses Bisnis Fakultas',
        }),
        expect.objectContaining({
          penggunaId: 'owner-1',
          kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_REVOKED,
        }),
      ]),
    );
    expect(notifikasiProsesBisnis.emitChangedMany).toHaveBeenCalledWith(['author-1', 'owner-1']);
  });

  it('rolls back feedback path when the effective status changed concurrently', async () => {
    const { service, notifikasiProsesBisnis, tx } = makeService({ transitionCount: 0 });

    await expect(service.revoke(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.logEditSOP.create).not.toHaveBeenCalled();
    expect(notifikasiProsesBisnis.createManyInTransaction).not.toHaveBeenCalled();
    expect(notifikasiProsesBisnis.emitChangedMany).not.toHaveBeenCalled();
  });

  it('rejects revocation while a newer revision is still in flight', async () => {
    const { service, catalog, notifikasiProsesBisnis } = makeService();
    (catalog.findRiwayatVersiBySopId as jest.Mock).mockResolvedValue([
      { detailSopId: 'detail-a', status: StatusSOP.EFFECTIVE },
      { detailSopId: 'detail-b', status: StatusSOP.DRAFT },
    ]);

    await expect(service.revoke(user, 'detail-a')).rejects.toBeInstanceOf(ConflictException);
    expect(notifikasiProsesBisnis.createManyInTransaction).not.toHaveBeenCalled();
  });

  it('rejects an unbound SOP because it is historical-only', async () => {
    const { service, prisma, authority, notifikasiProsesBisnis } = makeService();
    (prisma.sOP.findUnique as jest.Mock).mockResolvedValue({ prosesBisnisId: null });

    await expect(service.revoke(user, 'detail-a')).rejects.toThrow(
      'SOP tanpa Proses Bisnis hanya tersedia sebagai riwayat compatibility dan tidak dapat dicabut dari runtime FTI',
    );
    expect(authority.assertCanApprove).not.toHaveBeenCalled();
    expect(notifikasiProsesBisnis.createManyInTransaction).not.toHaveBeenCalled();
  });
});
