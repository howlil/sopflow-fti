import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

type ScalarRow = { value: bigint | number | string };

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk migration rehearsal`);
  return value;
};

const adapter = new PrismaMariaDb({
  host: required('DATABASE_HOST'),
  port: Number(process.env.DATABASE_PORT ?? '3306'),
  user: required('DATABASE_USER'),
  password: required('DATABASE_PASSWORD'),
  database: required('DATABASE_NAME'),
  connectionLimit: 1,
  connectTimeout: 15_000,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });
const active = 'ProcessSopBinding';
const retired = '_retired_ProcessSopBinding_20260906';

async function scalar(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<ScalarRow[]>(sql);
  return Number(rows[0]?.value ?? 0);
}

async function tableExists(name: string): Promise<boolean> {
  return (
    (await scalar(
      `SELECT COUNT(*) AS value FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${name}'`,
    )) === 1
  );
}

async function run(): Promise<void> {
  if (await tableExists(active)) throw new Error(`${active} masih aktif sebelum rehearsal`);
  if (!(await tableExists(retired))) throw new Error(`${retired} tidak ditemukan`);

  const before = await scalar(`SELECT COUNT(*) AS value FROM \`${retired}\``);
  let restoredToActive = false;
  try {
    await prisma.$executeRawUnsafe(`RENAME TABLE \`${retired}\` TO \`${active}\``);
    restoredToActive = true;

    const activeCount = await scalar(`SELECT COUNT(*) AS value FROM \`${active}\``);
    if (activeCount !== before) {
      throw new Error(`Rollback rehearsal mengubah row count: before=${before}, active=${activeCount}`);
    }

    await prisma.$executeRawUnsafe(`RENAME TABLE \`${active}\` TO \`${retired}\``);
    restoredToActive = false;

    const after = await scalar(`SELECT COUNT(*) AS value FROM \`${retired}\``);
    if (after !== before) {
      throw new Error(`Re-retirement mengubah row count: before=${before}, after=${after}`);
    }

    console.log(
      JSON.stringify({ result: 'PASS', retiredTable: retired, rowsBefore: before, rowsAfter: after }),
    );
  } finally {
    if (restoredToActive && (await tableExists(active)) && !(await tableExists(retired))) {
      await prisma.$executeRawUnsafe(`RENAME TABLE \`${active}\` TO \`${retired}\``);
    }
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
