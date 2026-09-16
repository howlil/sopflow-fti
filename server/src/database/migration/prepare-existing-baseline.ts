import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma';

const BASELINE_MIGRATION = '0_fti_native_baseline';
const SAFE_TO_ADOPT_EXIT_CODE = 42;

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk baseline adoption`);
  return value;
};

const environmentOrDefault = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
};

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: environmentOrDefault('DATABASE_HOST', 'localhost'),
    port: Number(environmentOrDefault('DATABASE_PORT', '3306')),
    user: environmentOrDefault('DATABASE_USER', 'sop_app'),
    password: required('DATABASE_PASSWORD'),
    database: environmentOrDefault('DATABASE_NAME', 'sop_biro_organisasi'),
    connectionLimit: 2,
    connectTimeout: 15_000,
    allowPublicKeyRetrieval: true,
  }),
});

type TableRow = { tableName: string };
type ColumnRow = { tableName: string; columnName: string };
type MigrationRow = {
  migrationName: string;
  finishedAt: Date | null;
  rolledBackAt: Date | null;
};

type ExpectedBaseline = Map<string, Set<string>>;

function parseBaseline(): ExpectedBaseline {
  const sql = readFileSync(
    join(process.cwd(), 'prisma/migrations', BASELINE_MIGRATION, 'migration.sql'),
    'utf8',
  );
  const expected: ExpectedBaseline = new Map();
  const createTable = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\n\) DEFAULT CHARACTER SET/g;

  for (const match of sql.matchAll(createTable)) {
    const table = match[1];
    const body = match[2];
    if (!table || body === undefined) continue;

    const columns = new Set<string>();
    for (const rawLine of body.split('\n')) {
      const columnMatch = rawLine.trim().match(/^`([^`]+)`\s+/);
      if (columnMatch?.[1]) columns.add(columnMatch[1].toLowerCase());
    }
    expected.set(table.toLowerCase(), columns);
  }

  if (expected.size === 0) {
    throw new Error('Baseline FTI tidak dapat diparse; adoption dibatalkan');
  }
  return expected;
}

async function run(): Promise<void> {
  const expected = parseBaseline();
  const tables = await prisma.$queryRawUnsafe<TableRow[]>(
    `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'`,
  );
  const actualTables = new Set(tables.map((row) => row.tableName.toLowerCase()));
  const businessTables = [...actualTables].filter((table) => table !== '_prisma_migrations');

  if (businessTables.length === 0) {
    console.log('Database belum berisi tabel aplikasi; baseline akan diterapkan normal.');
    return;
  }

  if (actualTables.has('_prisma_migrations')) {
    const rows = await prisma.$queryRawUnsafe<MigrationRow[]>(
      `SELECT migration_name AS migrationName,
              finished_at AS finishedAt,
              rolled_back_at AS rolledBackAt
         FROM _prisma_migrations
        WHERE migration_name = '${BASELINE_MIGRATION}'`,
    );
    if (rows.length > 0) {
      const applied = rows.some((row) => row.finishedAt !== null && row.rolledBackAt === null);
      if (applied) {
        console.log('Baseline FTI sudah tercatat sebagai applied.');
        return;
      }
      throw new Error(
        'Baseline FTI memiliki histori migration yang belum selesai; hentikan startup dan lakukan recovery eksplisit.',
      );
    }
  }

  const missingTables = [...expected.keys()].filter((table) => !actualTables.has(table));
  if (missingTables.length > 0) {
    throw new Error(
      `Database existing belum cocok dengan baseline FTI; tabel tidak ditemukan: ${missingTables.join(', ')}`,
    );
  }

  const columns = await prisma.$queryRawUnsafe<ColumnRow[]>(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const actualColumns = new Map<string, Set<string>>();
  for (const row of columns) {
    const table = row.tableName.toLowerCase();
    const tableColumns = actualColumns.get(table) ?? new Set<string>();
    tableColumns.add(row.columnName.toLowerCase());
    actualColumns.set(table, tableColumns);
  }

  const missingColumns: string[] = [];
  for (const [table, expectedColumns] of expected) {
    const tableColumns = actualColumns.get(table) ?? new Set<string>();
    for (const column of expectedColumns) {
      if (!tableColumns.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }
  if (missingColumns.length > 0) {
    throw new Error(
      `Database existing belum cocok dengan baseline FTI; kolom tidak ditemukan: ${missingColumns
        .slice(0, 20)
        .join(', ')}${missingColumns.length > 20 ? ` (+${missingColumns.length - 20} lainnya)` : ''}`,
    );
  }

  console.log(
    'Database existing memiliki seluruh tabel dan kolom baseline FTI; baseline aman ditandai applied tanpa menjalankan CREATE.',
  );
  process.exitCode = SAFE_TO_ADOPT_EXIT_CODE;
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
