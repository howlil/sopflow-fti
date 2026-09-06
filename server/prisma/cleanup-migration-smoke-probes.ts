import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const MIGRATION_SMOKE_PROCESS_PROBES = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
] as const;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi`);
  return value;
}

const port = Number(process.env.DATABASE_PORT ?? '3306');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DATABASE_PORT tidak valid');
}

const adapter = new PrismaMariaDb({
  host: required('DATABASE_HOST'),
  port,
  user: required('DATABASE_USER'),
  password: required('DATABASE_PASSWORD'),
  database: required('DATABASE_NAME'),
  connectionLimit: 2,
  connectTimeout: 15_000,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.process.deleteMany({
    where: { processId: { in: [...MIGRATION_SMOKE_PROCESS_PROBES] } },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
