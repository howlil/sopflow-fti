const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const auditFile = 'server/scripts/full-fti-runtime-audit.cjs';
const historicalMigrationPrefix = 'server/prisma/migrations/';
const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.cjs',
  '.mjs',
  '.prisma',
  '.md',
  '.yml',
  '.yaml',
  '.json',
  '.sh',
  '.py',
]);
const codeExtensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs', '.prisma', '.py']);

const forbiddenEverywhere = [
  /\bPeranPengguna\b/,
  /\bKEPALA_OPD\b/,
  /\bPJ_EVALUATOR\b/,
  /\bPJ_PENYUSUN\b/,
  /\bPengajuanEvaluasi\b/,
  /\bLegacySopRetention\b/,
  /\bopdId\b/,
  /\bopdNama\b/,
  /\bARSIP_OPD_[A-Z0-9_]*\b/,
  /StatusSOP\.(?:BERLAKU|DIGANTIKAN|DICABUT|SEDANG_DIEVALUASI|REVISI_DARI_EVALUATOR|DITOLAK_EVALUATOR|MENUNGGU_TTD_PJ_EVALUATOR)/,
  /BagianSOP\.EVALUASI\b/,
  /\bSiapDievaluasi\b/,
  /\bSiap Dievaluasi\b/,
  /legacy-unbound compatibility/i,
];
const forbiddenInCode = [
  /\bperan\s*:\s*['"](?:PENYUSUN|EVALUATOR|KEPALA_OPD|PJ_EVALUATOR|PJ_PENYUSUN)['"]/,
];
const forbiddenPaths = [
  /(?:^|\/)opd(?:\/|\.|-|_)/i,
  /(?:^|\/)tim\.dto\.ts$/,
  /identity-shadow-audit\.ts$/,
  /fti-legacy-retention-backfill\.ts$/,
];

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: repoRoot,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)
  .map((file) => file.replaceAll('\\', '/'));

const violations = [];

for (const relative of trackedFiles) {
  if (relative.startsWith(historicalMigrationPrefix) || relative === auditFile) continue;

  for (const pattern of forbiddenPaths) {
    if (pattern.test(relative)) violations.push(`${relative}: forbidden path ${pattern}`);
    pattern.lastIndex = 0;
  }

  const extension = path.extname(relative);
  if (!textExtensions.has(extension)) continue;

  const absolute = path.join(repoRoot, relative);
  const content = fs.readFileSync(absolute, 'utf8');
  for (const pattern of forbiddenEverywhere) {
    if (pattern.test(content)) violations.push(`${relative}: ${pattern}`);
    pattern.lastIndex = 0;
  }
  if (codeExtensions.has(extension)) {
    for (const pattern of forbiddenInCode) {
      if (pattern.test(content)) violations.push(`${relative}: ${pattern}`);
      pattern.lastIndex = 0;
    }
  }
}

const schemaPath = path.join(repoRoot, 'server/prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');
for (const pattern of [
  /model OPD\b/,
  /\bopdId\s+String/,
  /enum PeranPengguna\b/,
  /model PengajuanEvaluasi\b/,
  /\bperan\s+PeranPengguna/,
]) {
  if (pattern.test(schema)) violations.push(`server/prisma/schema.prisma: ${pattern}`);
}

if (violations.length > 0) {
  console.error('FTI-only repository audit failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  `FTI-only repository audit passed across ${trackedFiles.length} tracked files. ` +
    'Superseded vocabulary is permitted only in immutable migration history.',
);
