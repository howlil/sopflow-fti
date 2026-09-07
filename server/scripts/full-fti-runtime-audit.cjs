const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const scanRoots = [
  'server/src',
  'server/test',
  'client/src',
  'client/e2e',
];
const forbidden = [
  /\bPeranPengguna\b/,
  /\bKEPALA_OPD\b/,
  /\bPJ_EVALUATOR\b/,
  /\bPJ_PENYUSUN\b/,
  /\bPengajuanEvaluasi\b/,
  /\bLegacySopRetention\b/,
  /\bopdId\b/,
  /StatusSOP\.(?:BERLAKU|DIGANTIKAN|DICABUT|SEDANG_DIEVALUASI|REVISI_DARI_EVALUATOR|MENUNGGU_TTD_PJ_EVALUATOR)/,
];
const extensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']);
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(repoRoot, absolute).replaceAll('\\', '/');
    const content = fs.readFileSync(absolute, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(content)) violations.push(`${relative}: ${pattern}`);
      pattern.lastIndex = 0;
    }
  }
}

for (const root of scanRoots) walk(path.join(repoRoot, root));

const schema = fs.readFileSync(path.join(repoRoot, 'server/prisma/schema.prisma'), 'utf8');
for (const pattern of [/model OPD\b/, /\bopdId\s+String/, /enum PeranPengguna\b/, /model PengajuanEvaluasi\b/, /\bperan\s+PeranPengguna/]) {
  if (pattern.test(schema)) violations.push(`server/prisma/schema.prisma: ${pattern}`);
}

if (violations.length > 0) {
  console.error('FTI-only source audit failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('FTI-only source audit passed. Legacy vocabulary exists only in immutable migration history.');
