import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

type ScalarRow = { value: bigint | number | string };

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI baseline audit`);
  return value;
};

const databasePort = (): number => {
  const port = Number(process.env.DATABASE_PORT ?? '3306');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DATABASE_PORT tidak valid');
  }
  return port;
};

const adapter = new PrismaMariaDb({
  host: required('DATABASE_HOST'),
  port: databasePort(),
  user: required('DATABASE_USER'),
  password: required('DATABASE_PASSWORD'),
  database: required('DATABASE_NAME'),
  connectionLimit: 2,
  connectTimeout: 15_000,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function scalar(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<ScalarRow[]>(sql);
  const value = rows[0]?.value;
  if (value === undefined) throw new Error(`Audit query tidak mengembalikan nilai: ${sql}`);
  return Number(value);
}

async function tableExists(tableName: string): Promise<boolean> {
  return (
    (await scalar(
      `SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${tableName}'`,
    )) > 0
  );
}

async function run(): Promise<void> {
  const hasProcessReminderTable = await tableExists('ProcessReminder');
  const checks = {
    unresolvedFailedMigrations: await scalar(
      'SELECT COUNT(*) AS value FROM `_prisma_migrations` WHERE finished_at IS NULL AND rolled_back_at IS NULL',
    ),
    processScopeMismatches: await scalar(
      "SELECT COUNT(*) AS value FROM `Process` WHERE (`scope` = 'FACULTY' AND `departmentId` IS NOT NULL) OR (`scope` = 'DEPARTMENT' AND `departmentId` IS NULL)",
    ),
    processOwnerOrphans: await scalar(
      'SELECT COUNT(*) AS value FROM `Process` p LEFT JOIN `Pengguna` u ON u.`penggunaId` = p.`ownerId` WHERE u.`penggunaId` IS NULL',
    ),
    processMemberOrphans: await scalar(
      'SELECT COUNT(*) AS value FROM `ProcessMember` m LEFT JOIN `Process` p ON p.`processId` = m.`processId` LEFT JOIN `Pengguna` u ON u.`penggunaId` = m.`penggunaId` WHERE p.`processId` IS NULL OR u.`penggunaId` IS NULL',
    ),
    sopProcessOrphans: await scalar(
      'SELECT COUNT(*) AS value FROM `SOP` s LEFT JOIN `Process` p ON p.`processId` = s.`processId` WHERE s.`processId` IS NOT NULL AND p.`processId` IS NULL',
    ),
    bindingUnbackfilled: await scalar(
      'SELECT COUNT(*) AS value FROM `ProcessSopBinding` b LEFT JOIN `SOP` s ON s.`sopId` = b.`sopId` WHERE s.`sopId` IS NULL OR s.`processId` IS NULL',
    ),
    bindingOwnershipMismatches: await scalar(
      'SELECT COUNT(*) AS value FROM `ProcessSopBinding` b JOIN `SOP` s ON s.`sopId` = b.`sopId` WHERE s.`processId` <> b.`processId`',
    ),
    missingPelaksanaSnapshots: await scalar(
      'SELECT COUNT(*) AS value FROM `DetailSOPPelaksana` d LEFT JOIN `DetailSOPPelaksanaSnapshot` s ON s.`detailSopId` = d.`detailSopId` AND s.`pelaksanaId` = d.`pelaksanaId` WHERE s.`detailSopId` IS NULL',
    ),
    orphanPelaksanaSnapshots: await scalar(
      'SELECT COUNT(*) AS value FROM `DetailSOPPelaksanaSnapshot` s LEFT JOIN `DetailSOPPelaksana` d ON d.`detailSopId` = s.`detailSopId` AND d.`pelaksanaId` = s.`pelaksanaId` WHERE d.`detailSopId` IS NULL',
    ),
    duplicateEffectiveVersions: await scalar(
      "SELECT COUNT(*) AS value FROM (SELECT `sopId` FROM `DetailSOP` WHERE `status` = 'BERLAKU' GROUP BY `sopId` HAVING COUNT(*) > 1) duplicates",
    ),
    invalidDokumenTteParent: await scalar(
      'SELECT COUNT(*) AS value FROM `DokumenTte` WHERE ((`detailSopId` IS NULL) + (`pengajuanEvaluasiId` IS NULL)) <> 1',
    ),
    nativeReminderOrphans: hasProcessReminderTable
      ? await scalar(
          'SELECT COUNT(*) AS value FROM `ProcessReminder` r LEFT JOIN `DetailSOP` d ON d.`detailSopId` = r.`detailSopId` LEFT JOIN `SOP` s ON s.`sopId` = r.`sopId` LEFT JOIN `Process` p ON p.`processId` = r.`processId` LEFT JOIN `Pengguna` u ON u.`penggunaId` = r.`penggunaId` WHERE d.`detailSopId` IS NULL OR s.`sopId` IS NULL OR p.`processId` IS NULL OR u.`penggunaId` IS NULL OR d.`sopId` <> r.`sopId` OR s.`processId` <> r.`processId`',
        )
      : 0,
    nativeReminderStatusMismatches: hasProcessReminderTable
      ? await scalar(
          "SELECT COUNT(*) AS value FROM `ProcessReminder` r JOIN `DetailSOP` d ON d.`detailSopId` = r.`detailSopId` WHERE (r.`kind` = 'PROCESS_OWNER_REVIEW' AND d.`status` <> 'SEDANG_DIEVALUASI') OR (r.`kind` = 'PROCESS_REVISION' AND d.`status` <> 'REVISI_DARI_EVALUATOR') OR (r.`kind` = 'FINAL_APPROVAL' AND d.`status` <> 'MENUNGGU_TTD_PJ_EVALUATOR')",
        )
      : 0,
  };

  const classification = {
    sopNativeProcessBound: await scalar(
      'SELECT COUNT(*) AS value FROM `SOP` WHERE `processId` IS NOT NULL',
    ),
    sopLegacyOpdCompatible: await scalar(
      'SELECT COUNT(*) AS value FROM `SOP` WHERE `processId` IS NULL AND `opdId` IS NOT NULL',
    ),
    sopUnboundRequiresReview: await scalar(
      'SELECT COUNT(*) AS value FROM `SOP` WHERE `processId` IS NULL AND `opdId` IS NULL',
    ),
    penggunaWithLegacyOpdShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `opdId` IS NOT NULL',
    ),
    penggunaWithoutOpdShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `opdId` IS NULL',
    ),
    processSopBindingRows: await scalar('SELECT COUNT(*) AS value FROM `ProcessSopBinding`'),
    opdRows: await scalar('SELECT COUNT(*) AS value FROM `OPD`'),
    pengajuanEvaluasiRows: await scalar('SELECT COUNT(*) AS value FROM `PengajuanEvaluasi`'),
    retiredNilaiEvaluasiTablePresent: (await tableExists('_retired_NilaiEvaluasi_20260906')) ? 1 : 0,
    retiredLogNilaiEvaluasiTablePresent: (await tableExists('_retired_LogNilaiEvaluasi_20260906')) ? 1 : 0,
    retiredPengingatWhatsAppTablePresent: (await tableExists('_retired_PengingatWhatsApp_20260906')) ? 1 : 0,
    retiredNotifikasiInAppTablePresent: (await tableExists('_retired_NotifikasiInApp_20260906')) ? 1 : 0,
    nativeReminderTablePresent: hasProcessReminderTable ? 1 : 0,
    processReminderRows: hasProcessReminderTable
      ? await scalar('SELECT COUNT(*) AS value FROM `ProcessReminder`')
      : 0,
    processReminderActiveRows: hasProcessReminderTable
      ? await scalar('SELECT COUNT(*) AS value FROM `ProcessReminder` WHERE `lockedUntil` IS NULL')
      : 0,
  };

  const failedChecks = Object.entries(checks).filter(([, value]) => value !== 0);
  const report = {
    generatedAt: new Date().toISOString(),
    database: process.env.DATABASE_NAME,
    readOnly: true,
    checks,
    classification,
    result: failedChecks.length === 0 ? 'PASS' : 'FAIL',
  };

  console.log(JSON.stringify(report, null, 2));

  if (failedChecks.length > 0) {
    throw new Error(
      `FTI baseline invariant gagal: ${failedChecks.map(([name]) => name).join(', ')}`,
    );
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
