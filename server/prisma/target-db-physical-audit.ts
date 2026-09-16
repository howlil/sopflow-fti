import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI physical-schema audit`);
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

type ExpectedColumn = {
  table: string;
  column: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
};

type ColumnRow = {
  tableName: string;
  columnName: string;
  columnType: string;
  isNullable: 'YES' | 'NO';
  columnDefault: string | null;
};

type ExpectedForeignKey = {
  name: string;
  table: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  deleteRule: string;
  updateRule: string;
};

type ForeignKeyRow = {
  constraintName: string;
  tableName: string;
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
  ordinalPosition: number | bigint;
  deleteRule: string;
  updateRule: string;
};

type ExpectedIndex = {
  table: string;
  name: string;
  unique: boolean;
  columns: string[];
};

type IndexRow = {
  tableName: string;
  indexName: string;
  nonUnique: number | bigint;
  seqInIndex: number | bigint;
  columnName: string;
};

type ExpectedCheck = {
  table: string;
  name: string;
  clause: string;
};

type CheckRow = {
  tableName: string;
  constraintName: string;
  checkClause: string;
};

type LowerCaseTableNamesRow = {
  lowerCaseTableNames: number | string | bigint;
};

const migration = (name: string): string =>
  readFileSync(join(__dirname, `migrations/${name}/migration.sql`), 'utf8');

const baseline = migration('0_fti_native_baseline');
const batchMigration = migration('7_bulk_process_review_batches');

const removedTables = new Set([
  'LogEditSopDomainField',
  'LogEditSOP',
  'ProcessReminder',
  'ProcessAudit',
  'PelaksanaAuditAttribution',
  'ProcessFinalApproval',
]);

const targetStatusEnum = normalizeType(
  "ENUM('DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED')",
);
const targetNotificationEnum = normalizeType(
  "ENUM('PROCESS_OWNER_REVIEW_REQUESTED','TTE_REQUESTED','PROCESS_REVISION_REQUESTED','PROCESS_SOP_EFFECTIVE','PROCESS_SOP_REVOKED')",
);

function normalizeType(value: string): string {
  const type = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,\s+/g, ',');
  if (/^(?:integer|int)(?:\(\d+\))?$/.test(type)) return 'int';
  if (type === 'json') return 'longtext';
  return type;
}

function normalizeDefault(value: string | null): string | null {
  if (value === null) return null;
  let normalized = String(value).trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'null') return null;
  if (
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith('"') && normalized.endsWith('"'))
  ) {
    normalized = normalized.slice(1, -1);
  }
  return normalized;
}

function normalizeCheck(value: string): string {
  return value
    .replace(/`/g, '')
    .replace(/\s+/g, '')
    .replace(/^\((.*)\)$/s, '$1')
    .toLowerCase();
}

function quotedNames(value: string): string[] {
  return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);
}

function parsePhysicalContract(sql: string): {
  columns: ExpectedColumn[];
  indexes: ExpectedIndex[];
  checks: ExpectedCheck[];
} {
  const columns: ExpectedColumn[] = [];
  const indexes: ExpectedIndex[] = [];
  const checks: ExpectedCheck[] = [];
  const createTable = /CREATE TABLE `([^`]+)` \(\n([\s\S]*?)\n\) DEFAULT CHARACTER SET/g;

  for (const match of sql.matchAll(createTable)) {
    const table = match[1];
    const body = match[2];
    if (!table || body === undefined) continue;

    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim().replace(/,$/, '');
      if (!line) continue;

      const columnMatch = line.match(/^`([^`]+)`\s+(.+)$/);
      if (columnMatch) {
        const column = columnMatch[1];
        const definition = columnMatch[2];
        if (!column || !definition) continue;
        const nullMatch = definition.match(/\s+(NOT NULL|NULL)(?:\s|$)/);
        if (!nullMatch || nullMatch.index === undefined) {
          throw new Error(`Tidak dapat parse nullability migration ${table}.${column}: ${line}`);
        }
        const type = definition.slice(0, nullMatch.index).trim();
        const nullable = nullMatch[1] === 'NULL';
        const defaultMatch = definition.match(
          /(?:^|\s)DEFAULT\s+('(?:[^']|'')*'|"(?:[^"]|"")*"|[A-Za-z_]+(?:\(\d+\))?|-?\d+(?:\.\d+)?)(?:\s|$)/i,
        );
        columns.push({
          table,
          column,
          type: normalizeType(type),
          nullable,
          defaultValue: normalizeDefault(defaultMatch?.[1] ?? null),
        });
        continue;
      }

      const uniqueIndex = line.match(/^UNIQUE INDEX `([^`]+)`\((.+)\)$/);
      if (uniqueIndex) {
        indexes.push({
          table,
          name: uniqueIndex[1] as string,
          unique: true,
          columns: quotedNames(uniqueIndex[2] as string),
        });
        continue;
      }
      const normalIndex = line.match(/^INDEX `([^`]+)`\((.+)\)$/);
      if (normalIndex) {
        indexes.push({
          table,
          name: normalIndex[1] as string,
          unique: false,
          columns: quotedNames(normalIndex[2] as string),
        });
        continue;
      }
      const primaryKey = line.match(/^PRIMARY KEY \((.+)\)$/);
      if (primaryKey) {
        indexes.push({
          table,
          name: 'PRIMARY',
          unique: true,
          columns: quotedNames(primaryKey[1] as string),
        });
        continue;
      }
      const check = line.match(/^CONSTRAINT `([^`]+)` CHECK \((.+)\)$/i);
      if (check) {
        checks.push({
          table,
          name: check[1] as string,
          clause: normalizeCheck(check[2] as string),
        });
      }
    }
  }

  return { columns, indexes, checks };
}

function parseForeignKeys(sql: string): ExpectedForeignKey[] {
  const result: ExpectedForeignKey[] = [];
  const pattern = /ALTER TABLE `([^`]+)`\s+ADD CONSTRAINT `([^`]+)`\s+FOREIGN KEY \(([^)]+)\) REFERENCES `([^`]+)`\(([^)]+)\) ON DELETE (CASCADE|RESTRICT|SET NULL|NO ACTION) ON UPDATE (CASCADE|RESTRICT|SET NULL|NO ACTION);/g;
  for (const match of sql.matchAll(pattern)) {
    const [, table, name, columns, referencedTable, referencedColumns, deleteRule, updateRule] = match;
    if (!table || !name || !columns || !referencedTable || !referencedColumns || !deleteRule || !updateRule) continue;
    result.push({
      table,
      name,
      columns: quotedNames(columns),
      referencedTable,
      referencedColumns: quotedNames(referencedColumns),
      deleteRule,
      updateRule,
    });
  }
  return result;
}

function buildExpectedContract(): {
  columns: ExpectedColumn[];
  indexes: ExpectedIndex[];
  checks: ExpectedCheck[];
  foreignKeys: ExpectedForeignKey[];
} {
  const baselineContract = parsePhysicalContract(baseline);
  const batchContract = parsePhysicalContract(batchMigration);

  const columns = [...baselineContract.columns, ...batchContract.columns]
    .filter((column) => !removedTables.has(column.table))
    .map((column): ExpectedColumn => {
      if (column.table === 'SOP' && column.column === 'processId') {
        return { ...column, nullable: false };
      }
      if (column.table === 'DetailSOP' && column.column === 'status') {
        return { ...column, type: targetStatusEnum };
      }
      if (
        column.table === 'ProcessReview' &&
        (column.column === 'previousStatus' || column.column === 'nextStatus')
      ) {
        return { ...column, type: targetStatusEnum };
      }
      if (column.table === 'ProcessNotification' && column.column === 'kind') {
        return { ...column, type: targetNotificationEnum };
      }
      return column;
    });

  const indexes = [...baselineContract.indexes, ...batchContract.indexes]
    .filter((index) => !removedTables.has(index.table))
    .filter(
      (index) =>
        !(
          index.table === 'ProcessReviewBatchItem' &&
          index.name === 'ProcessReviewBatchItem_detailSopId_key'
        ),
    );
  indexes.push(
    {
      table: 'ProcessReviewBatchItem',
      name: 'ProcessReviewBatchItem_detail_idx',
      unique: false,
      columns: ['detailSopId'],
    },
    {
      table: 'ProcessReviewBatchItem',
      name: 'ProcessReviewBatchItem_batch_detail_key',
      unique: true,
      columns: ['processReviewBatchId', 'detailSopId'],
    },
  );

  const checks = [...baselineContract.checks, ...batchContract.checks].filter(
    (check) => !removedTables.has(check.table),
  );

  const foreignKeys = [...parseForeignKeys(baseline), ...parseForeignKeys(batchMigration)]
    .filter(
      (fk) => !removedTables.has(fk.table) && !removedTables.has(fk.referencedTable),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return { columns, indexes, checks, foreignKeys };
}

async function run(): Promise<void> {
  const expected = buildExpectedContract();
  const lowerCaseRows = await prisma.$queryRawUnsafe<LowerCaseTableNamesRow[]>(
    'SELECT @@lower_case_table_names AS lowerCaseTableNames',
  );
  const lowerCaseTableNames = Number(lowerCaseRows[0]?.lowerCaseTableNames ?? 0);
  const normalizeTableName = (value: string): string =>
    lowerCaseTableNames === 0 ? value : value.toLowerCase();

  const columnRows = await prisma.$queryRawUnsafe<ColumnRow[]>(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()`,
  );
  const actualColumns = new Map(
    columnRows.map((row) => [
      `${normalizeTableName(row.tableName)}.${row.columnName}`,
      row,
    ] as const),
  );
  const columnProblems: string[] = [];
  for (const column of expected.columns) {
    const actual = actualColumns.get(
      `${normalizeTableName(column.table)}.${column.column}`,
    );
    if (!actual) {
      columnProblems.push(`${column.table}.${column.column}: missing`);
      continue;
    }
    const actualType = normalizeType(actual.columnType);
    if (actualType !== column.type) {
      columnProblems.push(`${column.table}.${column.column}: type ${actualType} != ${column.type}`);
    }
    if ((actual.isNullable === 'YES') !== column.nullable) {
      columnProblems.push(`${column.table}.${column.column}: nullable ${actual.isNullable}`);
    }
    const actualDefault = normalizeDefault(actual.columnDefault);
    if (actualDefault !== column.defaultValue) {
      columnProblems.push(`${column.table}.${column.column}: default ${actualDefault} != ${column.defaultValue}`);
    }
  }

  const fkRows = await prisma.$queryRawUnsafe<ForeignKeyRow[]>(
    `SELECT k.CONSTRAINT_NAME AS constraintName, k.TABLE_NAME AS tableName,
            k.COLUMN_NAME AS columnName, k.REFERENCED_TABLE_NAME AS referencedTableName,
            k.REFERENCED_COLUMN_NAME AS referencedColumnName, k.ORDINAL_POSITION AS ordinalPosition,
            r.DELETE_RULE AS deleteRule, r.UPDATE_RULE AS updateRule
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
        AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
        AND r.TABLE_NAME = k.TABLE_NAME
      WHERE k.CONSTRAINT_SCHEMA = DATABASE()
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.CONSTRAINT_NAME, k.ORDINAL_POSITION`,
  );
  const actualFkGroups = new Map<string, ForeignKeyRow[]>();
  for (const row of fkRows) {
    const rows = actualFkGroups.get(row.constraintName) ?? [];
    rows.push(row);
    actualFkGroups.set(row.constraintName, rows);
  }
  const fkProblems: string[] = [];
  const expectedFkNames = new Set(expected.foreignKeys.map((fk) => fk.name));
  for (const fk of expected.foreignKeys) {
    const rows = actualFkGroups.get(fk.name);
    if (!rows) {
      fkProblems.push(`${fk.name}: missing`);
      continue;
    }
    const first = rows[0];
    const columns = rows.map((row) => row.columnName);
    const referencedColumns = rows.map((row) => row.referencedColumnName);
    if (
      first === undefined ||
      normalizeTableName(first.tableName) !== normalizeTableName(fk.table) ||
      normalizeTableName(first.referencedTableName) !== normalizeTableName(fk.referencedTable) ||
      columns.join(',') !== fk.columns.join(',') ||
      referencedColumns.join(',') !== fk.referencedColumns.join(',') ||
      first.deleteRule !== fk.deleteRule ||
      first.updateRule !== fk.updateRule
    ) {
      fkProblems.push(`${fk.name}: physical definition mismatch`);
    }
  }
  for (const name of actualFkGroups.keys()) {
    if (!expectedFkNames.has(name)) fkProblems.push(`${name}: unexpected foreign key`);
  }

  const indexRows = await prisma.$queryRawUnsafe<IndexRow[]>(
    `SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique,
            SEQ_IN_INDEX AS seqInIndex, COLUMN_NAME AS columnName
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
  );
  const actualIndexGroups = new Map<string, IndexRow[]>();
  for (const row of indexRows) {
    const key = `${normalizeTableName(row.tableName)}.${row.indexName}`;
    const rows = actualIndexGroups.get(key) ?? [];
    rows.push(row);
    actualIndexGroups.set(key, rows);
  }
  const indexProblems: string[] = [];
  for (const index of expected.indexes) {
    const rows = actualIndexGroups.get(
      `${normalizeTableName(index.table)}.${index.name}`,
    );
    if (!rows) {
      indexProblems.push(`${index.table}.${index.name}: missing`);
      continue;
    }
    const columns = rows.map((row) => row.columnName);
    const unique = Number(rows[0]?.nonUnique ?? 1) === 0;
    if (unique !== index.unique || columns.join(',') !== index.columns.join(',')) {
      indexProblems.push(`${index.table}.${index.name}: physical definition mismatch`);
    }
  }

  const checkRows = await prisma.$queryRawUnsafe<CheckRow[]>(
    `SELECT tc.TABLE_NAME AS tableName, tc.CONSTRAINT_NAME AS constraintName,
            cc.CHECK_CLAUSE AS checkClause
       FROM information_schema.TABLE_CONSTRAINTS tc
       JOIN information_schema.CHECK_CONSTRAINTS cc
         ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
        AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
        AND tc.CONSTRAINT_TYPE = 'CHECK'`,
  );
  const actualChecks = new Map(
    checkRows.map((row) => [
      `${normalizeTableName(row.tableName)}.${row.constraintName}`,
      normalizeCheck(row.checkClause),
    ] as const),
  );
  const checkProblems: string[] = [];
  for (const check of expected.checks) {
    const actual = actualChecks.get(
      `${normalizeTableName(check.table)}.${check.name}`,
    );
    if (actual === undefined) {
      checkProblems.push(`${check.table}.${check.name}: missing`);
    } else if (actual !== check.clause) {
      checkProblems.push(`${check.table}.${check.name}: physical definition mismatch`);
    }
  }

  const result = {
    lowerCaseTableNames,
    expectedColumns: expected.columns.length,
    expectedForeignKeys: expected.foreignKeys.length,
    expectedDeclaredIndexes: expected.indexes.length,
    expectedChecks: expected.checks.length,
    columnProblems,
    fkProblems,
    indexProblems,
    checkProblems,
  };
  console.log(JSON.stringify(result, null, 2));

  if (
    columnProblems.length ||
    fkProblems.length ||
    indexProblems.length ||
    checkProblems.length
  ) {
    throw new Error('FTI physical database contract tidak identik dengan canonical target');
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
