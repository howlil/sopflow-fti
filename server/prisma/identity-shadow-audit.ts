import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

type ScalarRow = { value: bigint | number | string };

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk identity-shadow audit`);
  return value;
};

const adapter = new PrismaMariaDb({
  host: required('DATABASE_HOST'),
  port: Number(process.env.DATABASE_PORT ?? '3306'),
  user: required('DATABASE_USER'),
  password: required('DATABASE_PASSWORD'),
  database: required('DATABASE_NAME'),
  connectionLimit: 1,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

async function scalar(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<ScalarRow[]>(sql);
  return Number(rows[0]?.value ?? 0);
}

async function run(): Promise<void> {
  const checks = {
    penggunaPeranNotNullable: await scalar(
      "SELECT COUNT(*) AS value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Pengguna' AND column_name = 'peran' AND is_nullable <> 'YES'",
    ),
    penggunaOpdNotNullable: await scalar(
      "SELECT COUNT(*) AS value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Pengguna' AND column_name = 'opdId' AND is_nullable <> 'YES'",
    ),
    legacyRoleSingletonTriggers: await scalar(
      "SELECT COUNT(*) AS value FROM information_schema.triggers WHERE trigger_schema = DATABASE() AND trigger_name IN ('trg_pengguna_singleton_pj_evaluator_insert','trg_pengguna_singleton_pj_evaluator_update')",
    ),
  };
  const classification = {
    penggunaWithLegacyRoleShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `peran` IS NOT NULL',
    ),
    penggunaWithoutLegacyRoleShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `peran` IS NULL',
    ),
    penggunaWithLegacyOpdShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `opdId` IS NOT NULL',
    ),
    penggunaWithoutLegacyOpdShadow: await scalar(
      'SELECT COUNT(*) AS value FROM `Pengguna` WHERE `opdId` IS NULL',
    ),
  };
  const failed = Object.entries(checks).filter(([, value]) => value !== 0);
  console.log(JSON.stringify({ checks, classification, result: failed.length === 0 ? 'PASS' : 'FAIL' }, null, 2));
  if (failed.length > 0) {
    throw new Error(`Identity-shadow invariant gagal: ${failed.map(([name]) => name).join(', ')}`);
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
