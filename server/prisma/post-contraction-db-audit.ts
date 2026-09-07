import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI schema audit`);
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

type ColumnRow = {
  tableName: string;
  columnName: string;
  columnType: string;
};

function parseMariaDbEnum(columnType: string): string[] | null {
  if (!columnType.startsWith('enum(') || !columnType.endsWith(')')) return null;
  const inner = columnType.slice(5, -1);
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (char === "'" && inner[index - 1] !== '\\') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      values.push(current.replaceAll("\\'", "'"));
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current.replaceAll("\\'", "'"));
  return values;
}

function sameSet(left: Iterable<string>, right: Iterable<string>): boolean {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((value) => b.has(value));
}

async function run(): Promise<void> {
  const models = Prisma.dmmf.datamodel.models;
  const enumByName = new Map(
    Prisma.dmmf.datamodel.enums.map((entry) => [entry.name, new Set(entry.values)]),
  );

  const expectedTables = new Set([
    '_prisma_migrations',
    ...models.map((model) => model.dbName ?? model.name),
  ]);
  const expectedColumns = new Map<string, Set<string>>();
  const expectedEnumColumns = new Map<string, Set<string>>();

  for (const model of models) {
    const tableName = model.dbName ?? model.name;
    expectedColumns.set(
      tableName,
      new Set(
        model.fields
          .filter((field) => field.kind !== 'object')
          .map((field) => field.dbName ?? field.name),
      ),
    );
    for (const field of model.fields) {
      if (field.kind !== 'enum') continue;
      const values = enumByName.get(field.type);
      if (values === undefined) {
        throw new Error(`Enum Prisma ${field.type} tidak ditemukan dalam DMMF`);
      }
      expectedEnumColumns.set(`${tableName}.${field.dbName ?? field.name}`, values);
    }
  }

  const tableRows = await prisma.$queryRawUnsafe<Array<{ tableName: string }>>(
    'SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'',
  );
  const actualTables = new Set(tableRows.map((row) => row.tableName));
  const missingTables = [...expectedTables].filter((table) => !actualTables.has(table)).sort();
  const unexpectedTables = [...actualTables].filter((table) => !expectedTables.has(table)).sort();

  const columnRows = await prisma.$queryRawUnsafe<ColumnRow[]>(
    'SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
  );
  const actualColumns = new Map<string, Set<string>>();
  for (const row of columnRows) {
    const columns = actualColumns.get(row.tableName) ?? new Set<string>();
    columns.add(row.columnName);
    actualColumns.set(row.tableName, columns);
  }

  const columnMismatches: Array<{
    table: string;
    missing: string[];
    unexpected: string[];
  }> = [];
  for (const [table, expected] of expectedColumns) {
    const actual = actualColumns.get(table) ?? new Set<string>();
    const missing = [...expected].filter((column) => !actual.has(column)).sort();
    const unexpected = [...actual].filter((column) => !expected.has(column)).sort();
    if (missing.length > 0 || unexpected.length > 0) {
      columnMismatches.push({ table, missing, unexpected });
    }
  }

  const enumMismatches: Array<{
    column: string;
    expected: string[];
    actual: string[] | null;
  }> = [];
  for (const row of columnRows) {
    const key = `${row.tableName}.${row.columnName}`;
    const expected = expectedEnumColumns.get(key);
    if (expected === undefined) continue;
    const actual = parseMariaDbEnum(row.columnType);
    if (actual === null || !sameSet(expected, actual)) {
      enumMismatches.push({
        column: key,
        expected: [...expected].sort(),
        actual: actual?.sort() ?? null,
      });
    }
  }

  const result = {
    missingTables,
    unexpectedTables,
    columnMismatches,
    enumMismatches,
  };
  console.log(JSON.stringify(result, null, 2));

  if (
    missingTables.length > 0 ||
    unexpectedTables.length > 0 ||
    columnMismatches.length > 0 ||
    enumMismatches.length > 0
  ) {
    throw new Error('FTI post-contraction database schema tidak identik dengan Prisma canonical');
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
