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
  ['server/src/modules/sop/process-authoring/process-version.service.ts', [/SopLegacy/, /UserOpdAccess/, /\.opdId\b/]],
  ['server/src/modules/sop/process-authoring/process-sop-authoring.module.ts', [/SopLegacy/, /OpdModule/]],
  ['server/src/modules/sop/public/sop-public.controller.ts', [/listOpd/, /ByOpd/, /opdId/]],
  ['server/src/modules/sop/public/sop-public.service.ts', [/listOpd/, /ByOpd/, /opdId/, /opdNama/]],
  ['server/src/modules/sop/public/sop-public.repository.ts', [/countOpdWithBerlakuSop/, /findOpdWithBerlakuSop/, /findBerlakuSopByOpd/, /UNION ALL/]],
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

if (violations.length > 0) {
  console.error('FULL_FTI_RUNTIME_AUDIT=FAIL');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('FULL_FTI_RUNTIME_AUDIT=PASS');