import { NestFactory } from '@nestjs/core';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma';
import { InitialSeedService } from './initial-seed.service';
import { SeedModule } from './seed.module';

type ExistingDomainRow = { hasRows: number | bigint };

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk seed awal`);
  return value;
};

const environmentOrDefault = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
};

/**
 * Fast path production: avoid booting a second Nest application context on
 * every restart just to discover that the database was already seeded.
 */
async function databaseAlreadyInitialized(): Promise<boolean> {
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: environmentOrDefault('DATABASE_HOST', 'localhost'),
      port: Number(environmentOrDefault('DATABASE_PORT', '3306')),
      user: environmentOrDefault('DATABASE_USER', 'sop_app'),
      password: required('DATABASE_PASSWORD'),
      database: environmentOrDefault('DATABASE_NAME', 'sop_biro_organisasi'),
      connectionLimit: 1,
      connectTimeout: 5_000,
      allowPublicKeyRetrieval: true,
    }),
  });

  try {
    const rows = await prisma.$queryRawUnsafe<ExistingDomainRow[]>(`
      SELECT (
        EXISTS(SELECT 1 FROM Pengguna LIMIT 1) OR
        EXISTS(SELECT 1 FROM Process LIMIT 1) OR
        EXISTS(SELECT 1 FROM Department LIMIT 1) OR
        EXISTS(SELECT 1 FROM Peraturan LIMIT 1) OR
        EXISTS(SELECT 1 FROM Pelaksana LIMIT 1)
      ) AS hasRows
    `);
    return Number(rows[0]?.hasRows ?? 0) === 1;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Entrypoint production untuk seed awal. Database yang sudah initialized
 * mengambil fast path di atas; Nest hanya di-boot untuk fresh database.
 */
async function bootstrap(): Promise<void> {
  if (await databaseAlreadyInitialized()) {
    console.log('Seed awal dilewati: database sudah memiliki data domain.');
    return;
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const initialSeedService = app.get(InitialSeedService);
    await initialSeedService.runIfDatabaseEmpty();
  } finally {
    await app.close();
  }
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
