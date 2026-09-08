import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI trigger audit`);
  return value;
};

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required('DATABASE_HOST'),
    port: Number(process.env.DATABASE_PORT ?? '3306'),
    user: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: required('DATABASE_NAME'),
    connectionLimit: 2,
    connectTimeout: 15_000,
    allowPublicKeyRetrieval: true,
  }),
});

type TriggerRow = {
  triggerName: string;
  eventObjectTable: string;
  actionStatement: string;
};

const expectedTriggerNames = new Set([
  'trg_detailsop_one_effective_insert',
  'trg_detailsop_one_effective_update',
  'trg_langkahsop_cabang_detail_insert',
  'trg_langkahsop_cabang_detail_update',
  'trg_langkahsop_pelaksana_swimlane_insert',
  'trg_langkahsop_pelaksana_swimlane_update',
  'trg_process_scope_department_insert',
  'trg_process_scope_department_update',
  'trg_sop_terkait_insert',
  'trg_sop_terkait_update',
]);

async function run(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<TriggerRow[]>(
    `SELECT
      TRIGGER_NAME AS triggerName,
      EVENT_OBJECT_TABLE AS eventObjectTable,
      ACTION_STATEMENT AS actionStatement
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
    ORDER BY TRIGGER_NAME`,
  );

  const actualNames = new Set(rows.map((row) => row.triggerName));
  const missing = [...expectedTriggerNames].filter((name) => !actualNames.has(name)).sort();
  const unexpected = [...actualNames].filter((name) => !expectedTriggerNames.has(name)).sort();
  const effectiveTriggerProblems = rows
    .filter((row) => row.triggerName.startsWith('trg_detailsop_one_effective_'))
    .filter(
      (row) =>
        row.eventObjectTable.toLowerCase() !== 'detailsop' ||
        !row.actionStatement.includes("'EFFECTIVE'"),
    )
    .map((row) => row.triggerName)
    .sort();

  const result = { missing, unexpected, effectiveTriggerProblems };
  console.log(JSON.stringify(result, null, 2));

  if (missing.length > 0 || unexpected.length > 0 || effectiveTriggerProblems.length > 0) {
    throw new Error('FTI database trigger set tidak identik dengan target canonical');
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
