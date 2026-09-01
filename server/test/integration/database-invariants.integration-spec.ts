import { ConflictException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  JenisDokumenTte,
  JenisPengajuanEvaluasi,
  PeranPengguna,
  StatusPengajuanEvaluasi,
  StatusSOP,
} from '../../src/generated/prisma';
import { PengajuanEvaluasiService } from '../../src/modules/evaluation/pengajuan/pengajuan-evaluasi.service';
import {
  assertSafeIntegrationDatabase,
  pingIntegrationDatabase,
  resetIntegrationDatabase,
} from './helpers/integration-database.util';
import { isIntegrationEnabled } from './helpers/integration-runtime.util';

const describeIntegration = isIntegrationEnabled() ? describe : describe.skip;

type CountRow = {
  total: bigint;
};

const TEST_PASSWORD_HASH = 'x'.repeat(60);

async function createTestUser(
  prisma: PrismaService,
  opdId: string,
  suffix: string,
  peran: PeranPengguna = PeranPengguna.PENYUSUN,
) {
  return prisma.pengguna.create({
    data: {
      email: `db-${suffix}@test.local`,
      opdId,
      nama: `User DB ${suffix}`,
      kataSandi: TEST_PASSWORD_HASH,
      peran,
      nip: suffix.padEnd(18, '0').slice(0, 18),
      jabatan: 'Penyusun',
      pangkat: 'Penata',
      nohp: `628${suffix.replace(/\D/g, '').padEnd(10, '0').slice(0, 10)}`,
    },
  });
}

async function createPendingDetail(prisma: PrismaService, opdId: string, suffix: string) {
  const sop = await prisma.sOP.create({
    data: {
      opdId,
      judul: `SOP Pending ${suffix}`,
    },
  });
  return prisma.detailSOP.create({
    data: {
      sopId: sop.sopId,
      status: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
      versi: 1,
      nomorSOP: `DB-PENDING-${suffix}`,
      namaLembaga: 'OPD DB Concurrency',
    },
  });
}

describeIntegration('Database migration invariants', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    assertSafeIntegrationDatabase();

    const { AppModule } = await import('../../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await pingIntegrationDatabase(prisma);
  });

  beforeEach(async () => {
    await resetIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    try {
      if (prisma !== undefined) {
        await resetIntegrationDatabase(prisma);
      }
    } finally {
      if (app !== undefined) {
        await app.close();
      }
    }
  });

  it('menjalankan migration chain Prisma, bukan hanya db push', async () => {
    const rows = await prisma.$queryRawUnsafe<CountRow[]>(
      'SELECT COUNT(*) AS total FROM `_prisma_migrations` WHERE `finished_at` IS NOT NULL',
    );

    expect(Number(rows[0]?.total ?? 0)).toBeGreaterThan(0);
  });

  it('memasang index operasional DetailSOP dari migration', async () => {
    const rows = await prisma.$queryRawUnsafe<CountRow[]>(`
      SELECT COUNT(*) AS total
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND LOWER(TABLE_NAME) = LOWER('DetailSOP')
        AND INDEX_NAME = 'DetailSOP_sopId_status_idx'
    `);

    expect(Number(rows[0]?.total ?? 0)).toBeGreaterThan(0);
  });

  it('menolak dua versi BERLAKU untuk SOP yang sama melalui invariant database', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB Invariant' } });
    const sop = await prisma.sOP.create({
      data: {
        opdId: opd.opdId,
        judul: 'SOP DB Invariant',
      },
    });

    await prisma.detailSOP.create({
      data: {
        sopId: sop.sopId,
        status: StatusSOP.BERLAKU,
        versi: 1,
        nomorSOP: 'DB-INV-001',
        namaLembaga: opd.nama,
      },
    });

    await expect(
      prisma.detailSOP.create({
        data: {
          sopId: sop.sopId,
          status: StatusSOP.BERLAKU,
          versi: 2,
          nomorSOP: 'DB-INV-002',
          namaLembaga: opd.nama,
        },
      }),
    ).rejects.toThrow();
  });

  it('menolak foreign key DetailSOP yang menunjuk SOP tidak valid', async () => {
    await expect(
      prisma.detailSOP.create({
        data: {
          sopId: '00000000-0000-4000-8000-000000000000',
          status: StatusSOP.DRAFT,
          versi: 1,
          nomorSOP: 'DB-INV-FK-001',
          namaLembaga: 'OPD DB Invariant',
        },
      }),
    ).rejects.toThrow();
  });

  it('menolak nilai enum StatusSOP yang tidak valid di level database', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB Enum' } });
    const sop = await prisma.sOP.create({
      data: {
        opdId: opd.opdId,
        judul: 'SOP DB Enum',
      },
    });

    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO \`DetailSOP\`
          (\`detailSopId\`, \`sopId\`, \`status\`, \`versi\`, \`nomorSOP\`, \`namaLembaga\`, \`createdAt\`, \`updatedAt\`)
        VALUES
          (UUID(), '${sop.sopId}', 'STATUS_TIDAK_VALID', 1, 'DB-INV-ENUM-001', '${opd.nama}', NOW(3), NOW(3))
      `),
    ).rejects.toThrow();
  });

  it('menghapus DetailSOP secara cascade ketika SOP induk dihapus', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB Cascade' } });
    const sop = await prisma.sOP.create({
      data: {
        opdId: opd.opdId,
        judul: 'SOP DB Cascade',
      },
    });
    const detail = await prisma.detailSOP.create({
      data: {
        sopId: sop.sopId,
        status: StatusSOP.DRAFT,
        versi: 1,
        nomorSOP: 'DB-INV-CASCADE-001',
        namaLembaga: opd.nama,
      },
    });

    await prisma.sOP.delete({ where: { sopId: sop.sopId } });

    await expect(
      prisma.detailSOP.findUnique({ where: { detailSopId: detail.detailSopId } }),
    ).resolves.toBeNull();
  });

  it('menegakkan Restrict ketika OPD masih direferensikan Pengguna', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB Restrict' } });
    await createTestUser(prisma, opd.opdId, '101');

    await expect(prisma.oPD.delete({ where: { opdId: opd.opdId } })).rejects.toThrow();
  });

  it('menjalankan SetNull ketika Pengguna editor Peraturan dihapus', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB SetNull' } });
    const user = await createTestUser(prisma, opd.opdId, '202');
    const peraturan = await prisma.peraturan.create({
      data: {
        nama: 'Peraturan DB SetNull',
        nomor: 'DB-SETNULL-202',
        tahun: 2026,
        tentang: 'Verifikasi referential action SetNull',
        lastEditedById: user.penggunaId,
      },
    });

    await prisma.pengguna.delete({ where: { penggunaId: user.penggunaId } });

    const reloaded = await prisma.peraturan.findUnique({
      where: { peraturanId: peraturan.peraturanId },
      select: { lastEditedById: true },
    });

    expect(reloaded?.lastEditedById).toBeNull();
  });

  it('menolak DokumenTte tanpa parent maupun dengan dua parent sekaligus', async () => {
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB XOR' } });
    const detail = await createPendingDetail(prisma, opd.opdId, 'XOR');
    const pengajuan = await prisma.pengajuanEvaluasi.create({
      data: {
        opdId: opd.opdId,
        jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
      },
    });
    const baseDokumen = {
      jenisDokumen: JenisDokumenTte.SOP_BERLAKU,
      judulDokumen: 'Dokumen XOR',
      hashDokumen: 'a'.repeat(64),
    };

    await expect(
      prisma.dokumenTte.create({
        data: {
          ...baseDokumen,
          nomorDokumen: 'DB-XOR-NONE',
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.dokumenTte.create({
        data: {
          ...baseDokumen,
          nomorDokumen: 'DB-XOR-BOTH',
          detailSopId: detail.detailSopId,
          pengajuanEvaluasiId: pengajuan.pengajuanEvaluasiId,
        },
      }),
    ).rejects.toThrow();
  });

  it('menjaga maksimal satu pengajuan evaluasi aktif per OPD saat request paralel', async () => {
    const service = app.get(PengajuanEvaluasiService);
    const opd = await prisma.oPD.create({ data: { nama: 'OPD DB Concurrency' } });
    const pjPenyusun = await createTestUser(prisma, opd.opdId, '303', PeranPengguna.PJ_PENYUSUN);
    const [detailA, detailB] = await Promise.all([
      createPendingDetail(prisma, opd.opdId, 'CONC-A'),
      createPendingDetail(prisma, opd.opdId, 'CONC-B'),
    ]);
    const user = {
      sub: pjPenyusun.penggunaId,
      email: pjPenyusun.email,
      peran: PeranPengguna.PJ_PENYUSUN,
    };

    const results = await Promise.allSettled([
      service.create(user, {
        jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
        sopDetailIds: [detailA.detailSopId],
      }),
      service.create(user, {
        jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
        sopDetailIds: [detailB.detailSopId],
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(ConflictException);
    await expect(
      prisma.pengajuanEvaluasi.count({
        where: {
          opdId: opd.opdId,
          status: StatusPengajuanEvaluasi.SEDANG_DIEVALUASI,
        },
      }),
    ).resolves.toBe(1);
  });
});
