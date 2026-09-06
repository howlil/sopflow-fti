const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..', '..');
const mustBeAbsent = [
  'server/src/common/guards/roles.guard.ts',
  'server/src/common/decorators/roles.decorator.ts',
  'server/src/modules/compatibility/legacy-opd',
  'server/src/modules/core/opd',
  'server/src/modules/core/evaluator',
  'server/src/modules/core/kepala-opd',
  'server/src/modules/core/penyusun',
  'server/src/modules/sop/catalog/sop-catalog.controller.ts',
  'server/src/modules/sop/catalog/sop-legacy-access.policy.ts',
  'server/src/modules/sop/catalog/sop-legacy-version-compatibility.module.ts',
  'server/src/modules/sop/catalog/sop-legacy-version-compatibility.service.ts',
  'client/src/api/opd.ts',
  'client/src/api/penyusun.ts',
  'client/src/hooks/useAppRole.ts',
  'client/src/utils/role-key.ts',
  'client/src/utils/role-routing.ts',
];

const forbiddenInNativeFiles = new Map([
  ['server/src/app.module.ts', [/LegacyOpdCompatibilityModule/, /OpdModule/, /EvaluatorModule/, /KepalaOpdModule/, /PenyusunModule/]],
  ['server/src/common/common.module.ts', [/RolesGuard/]],
  ['server/src/common/index.ts', [/UseJwtAndRolesGuards/, /RolesGuard/, /\bRoles\b/]],
  ['server/src/common/types/jwt-access-payload.type.ts', [/PeranPengguna/, /\bperan\??:/]],
  ['server/src/modules/core/auth/helpers/jwt-access.strategy.ts', [/PeranPengguna/, /\bperan\s*:/, /row\.peran/]],
  ['server/src/modules/core/auth/auth.repository.ts', [/\bperan\b/, /\bopdId\b/, /\bopd\s*:/]],
  ['server/src/modules/core/pengguna/pengguna.repository.ts', [/PeranPengguna/, /\bopdId\b/, /syncActiveRiwayatOpd/, /findPjEvaluator/, /findEvaluator/]],
  ['server/src/modules/core/pengguna/platform-account.service.ts', [/PeranPengguna/, /\bopdId\b/, /\bperan\b/]],
  ['server/src/modules/core/process/process-owner.service.ts', [/PeranPengguna/, /\bperan\s*:/, /\bopdId\s*:/]],
  ['server/src/modules/sop/pelaksana/pelaksana.service.ts', [/findLegacyStorageShadow/, /storageShadow/, /\bopdId\b/]],
  ['server/src/modules/sop/pelaksana/pelaksana.repository.ts', [/findLegacyStorageShadow/, /prisma\.oPD/, /opdShadowId/]],
  ['server/src/modules/sop/process-authoring/process-version.service.ts', [/SopLegacy/, /UserOpdAccess/, /\.opdId\b/]],
  ['server/src/modules/sop/process-authoring/process-sop-authoring.module.ts', [/SopLegacy/, /OpdModule/]],
  ['server/src/modules/sop/public/sop-public.controller.ts', [/listOpd/, /ByOpd/, /opdId/]],
  ['server/src/modules/sop/public/sop-public.service.ts', [/listOpd/, /ByOpd/, /opdId/, /opdNama/]],
  ['server/src/modules/sop/public/sop-public.repository.ts', [/countOpdWithBerlakuSop/, /findOpdWithBerlakuSop/, /findBerlakuSopByOpd/, /UNION ALL/]],
  // PeranPengguna is still valid in this file for immutable RiwayatTandaTangan evidence.
  // Current-user TTE profile lookup, however, must never require OPD identity.
  ['server/src/modules/tte/shared/repository/tte.repository.ts', [/\bopdId\b/, /\bopdNama\b/, /prisma\.oPD/]],
  ['server/src/modules/tte/core/tte.controller.ts', [/UseJwtAndRolesGuards/, /\bRoles\(/, /PeranPengguna/]],
  ['client/src/pages/public/arsip/components/arsip-sop-table.tsx', [/opdId/, /opdNama/, /Legacy\s*·\s*OPD/]],
]);

const violations = [];
for (const relative of mustBeAbsent) {
  if (existsSync(join(root, relative))) violations.push(`must be absent: ${relative}`);
}

for (const [relative, patterns] of forbiddenInNativeFiles) {
  const absolute = join(root, relative);
  if (!existsSync(absolute)) {
    violations.push(`required audit target missing: ${relative}`);
    continue;
  }
  const source = readFileSync(absolute, 'utf8');
  for (const pattern of patterns) {
    if (pattern.test(source)) violations.push(`${relative} matches ${pattern}`);
  }
}

const schemaPath = join(root, 'server/prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf8');
const penggunaBlock = schema.match(/model Pengguna \{[\s\S]*?\n\}/)?.[0] ?? '';
if (!/\bperan\s+PeranPengguna\?/.test(penggunaBlock)) {
  violations.push('Pengguna.peran must remain a nullable historical shadow');
}
if (!/\bopdId\s+String\?/.test(penggunaBlock)) {
  violations.push('Pengguna.opdId must remain a nullable historical shadow');
}
const signatureBlock = schema.match(/model RiwayatTandaTangan \{[\s\S]*?\n\}/)?.[0] ?? '';
if (!/\bperan\s+PeranPengguna(?:\s|$)/.test(signatureBlock) || /\bperan\s+PeranPengguna\?/.test(signatureBlock)) {
  violations.push('RiwayatTandaTangan.peran must remain required historical signing evidence');
}

if (violations.length > 0) {
  console.error('FULL_FTI_RUNTIME_AUDIT=FAIL');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('FULL_FTI_RUNTIME_AUDIT=PASS');
