import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { LegacySopRetentionKind, PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk legacy retention backfill`);
  return value;
};

const port = Number(process.env.DATABASE_PORT ?? '3306');
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('DATABASE_PORT tidak valid');
}

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

async function run(): Promise<void> {
  const rows = await prisma.sOP.findMany({
    where: { processId: null },
    select: {
      sopId: true,
      judul: true,
      opdId: true,
      opd: { select: { nama: true } },
    },
  });

  let captured = 0;
  for (const row of rows) {
    await prisma.legacySopRetention.upsert({
      where: { sopId: row.sopId },
      create: {
        sopId: row.sopId,
        kind:
          row.opdId === null
            ? LegacySopRetentionKind.HISTORICAL_UNSCOPED
            : LegacySopRetentionKind.HISTORICAL_OPD,
        legacyOpdId: row.opdId,
        legacyOpdNameSnapshot: row.opd?.nama ?? null,
        sopTitleSnapshot: row.judul,
        reason: 'Captured during Full FTI legacy runtime retirement',
      },
      update: {
        kind:
          row.opdId === null
            ? LegacySopRetentionKind.HISTORICAL_UNSCOPED
            : LegacySopRetentionKind.HISTORICAL_OPD,
        legacyOpdId: row.opdId,
        legacyOpdNameSnapshot: row.opd?.nama ?? null,
        sopTitleSnapshot: row.judul,
      },
    });
    captured += 1;
  }

  console.log(
    JSON.stringify(
      {
        database: process.env.DATABASE_NAME,
        unboundSopRows: rows.length,
        retentionRowsUpserted: captured,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
