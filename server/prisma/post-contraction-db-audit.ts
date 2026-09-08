import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

type LowerCaseTableNamesRow = {
  lowerCaseTableNames: number | string | bigint;
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
      values.push(current.split("\\'").join("'"));
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current.split("\\'").join("'"));
  return values;
}

function parseCanonicalEnumValues(): Map<string, Set<string>> {
  const schema = readFileSync(join(__dirname, 'schema.prisma'), 'utf8');
  const enumByName = new Map<string, Set<string>>();
  const enumPattern = /enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}/g;

  for (const match of schema.matchAll(enumPattern)) {
    const [, enumName, body] = match;
    if (enumName === undefined || body === undefined) continue;

    const values = new Set<string>();
    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line) continue;
      const valueMatch = line.match(
        /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+@map\("([^"]+)"\))?/,
      );
      if (valueMatch === null) continue;
      const [, valueName, mappedName] = valueMatch;
      if (valueName !== undefined) values.add(mappedName ?? valueName);
    }

    enumByName.set(enumName, values);
  }

  return enumByName;
}

function sameSet(left: Iterable<string>, right: Iterable<string>): boolean {
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((value) => b.has(value));
}

async function run(): Promise<void> {
  const models = Prisma.dmmf.datamodel.models;
  const enumByName = parseCanonicalEnumValues();
  const lowerCaseTableNamesRows = await prisma.$queryRawUnsafe<LowerCaseTableNamesRow[]>(
    'SELECT @@lower_case_table_names AS lowerCaseTableNames',
  );
  const lowerCaseTableNames = Number(lowerCaseTableNamesRows[0]?.lowerCaseTableNames ?? 0);
  const normalizeTableName = (tableName: string): string =>
    lowerCaseTableNames === 0 ? tableName : tableName.toLowerCase();

  const expectedTables = new Set([
    '_prisma_migrations',
    ...models.map((model) => model.dbName ?? model.name),
  ]);
  const expectedTableByKey = new Map(
    [...expectedTables].map((tableName) => [normalizeTableName(tableName), tableName] as const),
  );
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
      if (values === undefined || values.size === 0) {
        throw new Error(`Enum Prisma ${field.type} tidak ditemukan dalam schema canonical`);
      }
      expectedEnumColumns.set(
        `${normalizeTableName(tableName)}.${field.dbName ?? field.name}`,
        values,
      );
    }
  }

  const tableRows = await prisma.$queryRawUnsafe<Array<{ tableName: string }>>(
    'SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'',
  );
  const actualTableByKey = new Map(
    tableRows.map((row) => [normalizeTableName(row.tableName), row.tableName] as const),
  );
  const missingTables = [...expectedTables]
    .filter((table) => !actualTableByKey.has(normalizeTableName(table)))
    .sort();
  const unexpectedTables = tableRows
    .filter((row) => !expectedTableByKey.has(normalizeTableName(row.tableName)))
    .map((row) => row.tableName)
    .sort();

  const columnRows = await prisma.$queryRawUnsafe<ColumnRow[]>(
    'SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
  );
  const actualColumns = new Map<string, Set<string>>();
  for (const row of columnRows) {
    const tableKey = normalizeTableName(row.tableName);
    const columns = actualColumns.get(tableKey) ?? new Set<string>();
    columns.add(row.columnName);
    actualColumns.set(tableKey, columns);
  }

  const columnMismatches: Array<{
    table: string;
    missing: string[];
    unexpected: string[];
  }> = [];
  for (const [table, expected] of expectedColumns) {
    const actual = actualColumns.get(normalizeTableName(table)) ?? new Set<string>();
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
    const key = `${normalizeTableName(row.tableName)}.${row.columnName}`;
    const expected = expectedEnumColumns.get(key);
    if (expected === undefined) continue;
    const actual = parseMariaDbEnum(row.columnType);
    if (actual === null || !sameSet(expected, actual)) {
      enumMismatches.push({
        column: `${row.tableName}.${row.columnName}`,
        expected: [...expected].sort(),
        actual: actual?.sort() ?? null,
      });
    }
  }

  const result = {
    lowerCaseTableNames,
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
