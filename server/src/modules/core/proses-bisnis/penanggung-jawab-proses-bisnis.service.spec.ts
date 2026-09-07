import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LingkupOrganisasi,
  JenisAktivitasProsesBisnis,
  StatusKeaktifanProsesBisnis,
} from '../../../generated/prisma';
import type { KewenanganPenanggungJawabProsesBisnisService } from './kewenangan-penanggung-jawab-proses-bisnis.service';
import { PenanggungJawabProsesBisnisService } from './penanggung-jawab-proses-bisnis.service';

describe('PenanggungJawabProsesBisnisService', () => {
  const penanggungJawabId = '11111111-1111-4111-8111-111111111111';
  const prosesBisnisId = '22222222-2222-4222-8222-222222222222';

  function makeService() {
    const prisma = {
      prosesBisnis: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      siklusProsesBisnis: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      riwayatAktivitasProsesBisnis: {
        create: jest.fn(),
      },
      anggotaProsesBisnis: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      undanganAnggotaProsesBisnis: {
        findFirst: jest.fn(),
      },
      pengguna: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      detailSOP: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (work: unknown) => {
      if (typeof work === 'function') return work(prisma);
      return Promise.all(work as Promise<unknown>[]);
    });
    const authority = {
      assertCanCreate: jest.fn(),
      listMine: jest.fn(),
    };
    return {
      prisma,
      authority,
      service: new PenanggungJawabProsesBisnisService(
        prisma as unknown as PrismaService,
        authority as unknown as KewenanganPenanggungJawabProsesBisnisService,
      ),
    };
  }

  it('creates Proses Bisnis with the current authorized user as owner and no forced initial anggota', async () => {
    const { prisma, authority, service } = makeService();
    authority.assertCanCreate.mockResolvedValue({
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      kunciLingkup: 'FACULTY',
    });
    prisma.prosesBisnis.count.mockResolvedValue(0);
    prisma.prosesBisnis.create.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      penanggungJawabId,
      createdAt: new Date(),
      updatedAt: new Date(),
      departemen: null,
      penanggungJawab: { penggunaId: penanggungJawabId, nama: 'Owner', email: 'owner@fti.test', nip: '1', platformRole: 'USER' },
      anggota: [],
    });
    prisma.statusProsesBisnis.findMany.mockResolvedValue([
      {
        prosesBisnisId,
        status: StatusKeaktifanProsesBisnis.ACTIVE,
        archivedAt: null,
        archivedReason: null,
        updatedAt: new Date(),
      },
    ]);

    const result = await service.createProsesBisnis(penanggungJawabId, {
      nama: '  Tata Kelola TI  ',
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
    });

    expect(prisma.prosesBisnis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          nama: 'Tata Kelola TI',
          lingkup: LingkupOrganisasi.FACULTY,
          departemenId: null,
          penanggungJawabId,
        },
      }),
    );
    expect(prisma.riwayatAktivitasProsesBisnis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        prosesBisnisId,
        actorId: penanggungJawabId,
        event: JenisAktivitasProsesBisnis.PROCESS_CREATED,
      }),
    });
    expect(result?.siklusStatus).toBe(StatusKeaktifanProsesBisnis.ACTIVE);
  });

  it('reuses an active existing identity when NIP already exists even if email differs', async () => {
    const { prisma, service } = makeService();
    const anggotaId = '33333333-3333-4333-8333-333333333333';
    const existingUser = {
      penggunaId: anggotaId,
      nama: 'Existing Member',
      email: 'existing@fti.test',
      nip: '198501012009011111',
      platformRole: 'USER',
      deletedAt: null,
    };
    prisma.prosesBisnis.findFirst.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      penanggungJawabId,
      departemen: null,
      penanggungJawab: { penggunaId: penanggungJawabId },
      anggota: [],
    });
    prisma.statusProsesBisnis.findUnique.mockResolvedValue(null);
    prisma.pengguna.findFirst.mockResolvedValue(existingUser);
    prisma.anggotaProsesBisnis.findUnique.mockResolvedValue(null);

    const result = await service.undangAnggota(penanggungJawabId, prosesBisnisId, {
      nama: 'Nama dari form',
      nip: existingUser.nip,
      email: 'email-baru@fti.test',
      jabatan: 'Penyusun SOP',
      pangkat: 'Penata',
      nohp: '6281234567890',
    });

    expect(prisma.pengguna.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        OR: [
          { email: 'email-baru@fti.test' },
          { nip: existingUser.nip },
        ],
      },
    });
    expect(prisma.anggotaProsesBisnis.create).toHaveBeenCalledWith({
      data: { prosesBisnisId, penggunaId: anggotaId },
    });
    expect(result).toEqual({
      kind: 'MEMBER_ADDED',
      anggota: {
        penggunaId: anggotaId,
        nama: existingUser.nama,
        email: existingUser.email,
      },
    });
  });

  it('blocks archive while a Proses Bisnis still has an in-flight SOP siklus', async () => {
    const { prisma, service } = makeService();
    prisma.prosesBisnis.findFirst.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      lingkup: LingkupOrganisasi.FACULTY,
      departemenId: null,
      penanggungJawabId,
      createdAt: new Date(),
      updatedAt: new Date(),
      departemen: null,
      penanggungJawab: { penggunaId: penanggungJawabId },
      anggota: [],
    });
    prisma.statusProsesBisnis.findUnique.mockResolvedValue({
      prosesBisnisId,
      status: StatusKeaktifanProsesBisnis.ACTIVE,
      archivedAt: null,
      archivedReason: null,
      updatedAt: new Date(),
    });
    prisma.detailSOP.count.mockResolvedValue(1);

    await expect(
      service.archiveProsesBisnis(penanggungJawabId, prosesBisnisId, { reason: 'Tidak digunakan' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.statusProsesBisnis.upsert).not.toHaveBeenCalled();
  });
});
