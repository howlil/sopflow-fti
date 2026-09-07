import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI schema audit`);
  return value;
};

const port = Number(process.env.DATABASE_PORT ?? '3306');
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required('DATABASE_HOST'),
    port,
    user: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: required('DATABASE_NAME'),
    connectionLimit: 2,
    connectTimeout: 15_000,
    allowPublicKeyRetrieval: true,
  }),
});

async function scalar(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ value: bigint | number | string }>>(sql);
  return Number(rows[0]?.value ?? 0);
}

async function run(): Promise<void> {
  const removedTables = [
    'OPD',
    'RiwayatOpdPengguna',
    'OPDPeraturan',
    'PengajuanEvaluasi',
    'NilaiEvaluasi',
    'PengingatWhatsApp',
    'LegacySopRetention',
    '_retired_ProcessSopBinding_20260906',
  ];
  const removedColumns: Array<[string, string]> = [
    ['Pengguna', 'opdId'],
    ['Pengguna', 'peran'],
    ['SOP', 'opdId'],
    ['Pelaksana', 'opdId'],
    ['DokumenTte', 'pengajuanEvaluasiId'],
    ['RiwayatTandaTangan', 'peran'],
  ];

  const tableResidue = await scalar(
    `SELECT COUNT(*) AS value FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${removedTables.map((name) => `'${name}'`).join(',')})`,
  );
  let columnResidue = 0;
  for (const [tableName, columnName] of removedColumns) {
    columnResidue += await scalar(
      `SELECT COUNT(*) AS value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`,
    );
  }

  const invalidStatusRows = await scalar(
    "SELECT COUNT(*) AS value FROM `DetailSOP` WHERE `status` NOT IN ('DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL','TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED')",
  );
  const statusColumnWithLegacyValues = await scalar(
    "SELECT COUNT(*) AS value FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DetailSOP' AND COLUMN_NAME = 'status' AND (COLUMN_TYPE LIKE '%SEDANG_DIEVALUASI%' OR COLUMN_TYPE LIKE '%REVISI_DARI_EVALUATOR%' OR COLUMN_TYPE LIKE '%MENUNGGU_TTD_PJ_EVALUATOR%' OR COLUMN_TYPE LIKE '%BERLAKU%' OR COLUMN_TYPE LIKE '%DICABUT%')",
  );
  const orphanedProcessSop = await scalar(
    'SELECT COUNT(*) AS value FROM `SOP` s LEFT JOIN `Process` p ON p.processId = s.processId WHERE s.processId IS NOT NULL AND p.processId IS NULL',
  );
  const invalidSigningAuthority = await scalar(
    "SELECT COUNT(*) AS value FROM `RiwayatTandaTangan` WHERE `authority` NOT IN ('DEAN','HEAD_OF_DEPARTMENT')",
  );

  const result = {
    tableResidue,
    columnResidue,
    invalidStatusRows,
    statusColumnWithLegacyValues,
    orphanedProcessSop,
    invalidSigningAuthority,
  };
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result).some((value) => value !== 0)) {
    throw new Error('FTI post-contraction database invariant gagal');
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
