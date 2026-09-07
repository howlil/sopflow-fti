import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LingkupOrganisasi,
  JenisAktivitasProsesBisnis,
  StatusKeaktifanProsesBisnis,
} from '../../../generated/prisma';
import type { KewenanganPenanggungJawabProsesBisnisService } from './process-owner-authority.service';
import { ProsesBisnisOwnerService } from './process-owner.service';

describe('ProsesBisnisOwnerService', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const prosesBisnisId = '22222222-2222-4222-8222-222222222222';

  function makeService() {
    const prisma = {
      process: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      processLifecycle: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      processAudit: {
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
      service: new ProsesBisnisOwnerService(
        prisma as unknown as PrismaService,
        authority as unknown as KewenanganPenanggungJawabProsesBisnisService,
      ),
    };
  }

  it('creates Proses Bisnis with the current authorized user as owner and no forced initial member', async () => {
    const { prisma, authority, service } = makeService();
    authority.assertCanCreate.mockResolvedValue({
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
      scopeKey: 'FACULTY',
    });
    prisma.process.count.mockResolvedValue(0);
    prisma.process.create.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: null,
      owner: { penggunaId: ownerId, nama: 'Owner', email: 'owner@fti.test', nip: '1', platformRole: 'USER' },
      members: [],
    });
    prisma.processLifecycle.findMany.mockResolvedValue([
      {
        prosesBisnisId,
        status: StatusKeaktifanProsesBisnis.ACTIVE,
        archivedAt: null,
        archivedReason: null,
        updatedAt: new Date(),
      },
    ]);

    const result = await service.createProsesBisnis(ownerId, {
      nama: '  Tata Kelola TI  ',
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
    });

    expect(prisma.process.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          nama: 'Tata Kelola TI',
          scope: LingkupOrganisasi.FACULTY,
          departemenId: null,
          ownerId,
        },
      }),
    );
    expect(prisma.processAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        prosesBisnisId,
        actorId: ownerId,
        event: JenisAktivitasProsesBisnis.PROCESS_CREATED,
      }),
    });
    expect(result?.lifecycleStatus).toBe(StatusKeaktifanProsesBisnis.ACTIVE);
  });

  it('reuses an active existing identity when NIP already exists even if email differs', async () => {
    const { prisma, service } = makeService();
    const memberId = '33333333-3333-4333-8333-333333333333';
    const existingUser = {
      penggunaId: memberId,
      nama: 'Existing Member',
      email: 'existing@fti.test',
      nip: '198501012009011111',
      platformRole: 'USER',
      deletedAt: null,
    };
    prisma.process.findFirst.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
      ownerId,
      department: null,
      owner: { penggunaId: ownerId },
      members: [],
    });
    prisma.processLifecycle.findUnique.mockResolvedValue(null);
    prisma.pengguna.findFirst.mockResolvedValue(existingUser);
    prisma.anggotaProsesBisnis.findUnique.mockResolvedValue(null);

    const result = await service.inviteMember(ownerId, prosesBisnisId, {
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
      data: { prosesBisnisId, penggunaId: memberId },
    });
    expect(result).toEqual({
      kind: 'MEMBER_ADDED',
      member: {
        penggunaId: memberId,
        nama: existingUser.nama,
        email: existingUser.email,
      },
    });
  });

  it('blocks archive while a Proses Bisnis still has an in-flight SOP lifecycle', async () => {
    const { prisma, service } = makeService();
    prisma.process.findFirst.mockResolvedValue({
      prosesBisnisId,
      nama: 'Tata Kelola TI',
      scope: LingkupOrganisasi.FACULTY,
      departemenId: null,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      department: null,
      owner: { penggunaId: ownerId },
      members: [],
    });
    prisma.processLifecycle.findUnique.mockResolvedValue({
      prosesBisnisId,
      status: StatusKeaktifanProsesBisnis.ACTIVE,
      archivedAt: null,
      archivedReason: null,
      updatedAt: new Date(),
    });
    prisma.detailSOP.count.mockResolvedValue(1);

    await expect(
      service.archiveProsesBisnis(ownerId, prosesBisnisId, { reason: 'Tidak digunakan' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.processLifecycle.upsert).not.toHaveBeenCalled();
  });
});
