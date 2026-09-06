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
  'server/src/modules/sop/catalog/sop-status-policy.ts',
  'server/src/modules/sop/catalog/sop-status-policy.spec.ts',
  'server/src/modules/sop/catalog/dto/create-sop.dto.ts',
  'server/src/modules/sop/catalog/dto/update-detail-sop-status.dto.ts',
  'server/src/modules/sop/catalog/dto/kepala-opd-ringkas.dto.ts',
  'client/src/api/opd.ts',
  'client/src/api/penyusun.ts',
  'client/src/hooks/useAppRole.ts',
  'client/src/utils/role-key.ts',
  'client/src/utils/role-routing.ts',
  'client/src/components/organisasi',
  'client/src/lib/sop/cabut-sop.util.ts',
  'client/e2e/auth.spec.ts',
  'client/e2e/layout-shell.spec.ts',
  'client/e2e/list-filter-pagination.spec.ts',
  'client/e2e/master-data.spec.ts',
  'client/e2e/pdf-verification.spec.ts',
  'client/e2e/profile-tte.spec.ts',
  'client/e2e/public-pages.spec.ts',
  'client/e2e/role-access.spec.ts',
  'client/e2e/scenario-traceability.spec.ts',
  'client/e2e/screenshots.spec.ts',
  'client/e2e/sop-authoring.spec.ts',
  'client/e2e/sop-concurrency.spec.ts',
  'client/e2e/journeys/public-integrity.spec.ts',
  'client/e2e/journeys/sop-lifecycle.spec.ts',
  'client/e2e/journeys/m13-native-fti-lifecycle.spec.ts',
  'client/e2e/support/business-actions.ts',
  'client/e2e/support/business-audit.ts',
  'client/e2e/support/business-preconditions.ts',
  'server/prisma/seed-e2e.ts',
  'server/test/integration/core-workflow.integration-spec.ts',
  'server/test/integration/evaluasi-edge-cases.integration-spec.ts',
  'server/test/integration/evaluasi-grafik.integration-spec.ts',
  'server/test/integration/opd-penyusun-lifecycle.integration-spec.ts',
  'server/test/integration/rbac-access-control.integration-spec.ts',
  'server/test/integration/sop-versioning.integration-spec.ts',
  'server/test/integration/tte-pdf-qr-verifikasi.integration-spec.ts',
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
  ['server/src/modules/core/process/process-context.service.ts', [/\bperan\b/, /PeranPengguna/]],
  ['server/src/modules/sop/pelaksana/pelaksana.service.ts', [/findLegacyStorageShadow/, /storageShadow/, /\bopdId\b/]],
  ['server/src/modules/sop/pelaksana/pelaksana.repository.ts', [/findLegacyStorageShadow/, /prisma\.oPD/, /opdShadowId/]],
  ['server/src/modules/sop/catalog/sop-catalog.repository.ts', [/PeranPengguna/, /prisma\.oPD/, /KEPALA_OPD/]],
  ['server/src/modules/sop/catalog/sop-catalog.mapper.ts', [/row\.opdId/, /kepalaOpd/, /pengguna\.peran/]],
  ['server/src/modules/sop/process-authoring/process-version.service.ts', [/SopLegacy/, /UserOpdAccess/, /\.opdId\b/]],
  ['server/src/modules/sop/process-authoring/process-sop-authoring.module.ts', [/SopLegacy/, /OpdModule/]],
  ['server/src/modules/sop/public/sop-public.controller.ts', [/listOpd/, /ByOpd/, /opdId/]],
  ['server/src/modules/sop/public/sop-public.service.ts', [/listOpd/, /ByOpd/, /opdId/, /opdNama/]],
  ['server/src/modules/sop/public/sop-public.repository.ts', [/countOpdWithBerlakuSop/, /findOpdWithBerlakuSop/, /findBerlakuSopByOpd/, /UNION ALL/]],
  ['server/src/modules/tte/shared/repository/tte.repository.ts', [/\bopdId\b/, /\bopdNama\b/, /prisma\.oPD/]],
  ['server/src/modules/tte/core/tte.controller.ts', [/UseJwtAndRolesGuards/, /\bRoles\(/, /PeranPengguna/]],
  ['server/src/database/seed/seed.service.ts', [/tx\.oPD\b/, /tx\.riwayatOpdPengguna\b/, /tx\.oPDPeraturan\b/, /PeranPengguna/, /SEED_OPD/]],
  ['client/src/pages/public/arsip/components/arsip-sop-table.tsx', [/opdId/, /opdNama/, /Legacy\s*·\s*OPD/]],
  ['client/src/pages/LandingPage.tsx', [/Pemerintah Provinsi Sumatera Barat/, /Biro Organisasi/, /Kepala OPD/, /PJ Evaluator/]],
  ['client/src/pages/landing/landing-product-preview.tsx', [/Pengajuan Evaluasi/, /SOP OPD/, /PJ Evaluator/, /Kepala OPD/]],
  ['client/src/pages/landing/public-footer.tsx', [/Pemerintah Provinsi Sumatera Barat/, /Biro Organisasi/, /Sekretariat Daerah/]],
  ['client/src/pages/landing/institutional-closing.tsx', [/Kantor_Gubernur_Sumbar/, /Pemerintah Provinsi Sumatera Barat/, /Biro Organisasi/]],
  ['client/src/pages/login/components/LoginHero.tsx', [/Pemerintah Provinsi Sumatera Barat/, /Biro Organisasi/, /Kepala OPD/, /PJ Evaluator/]],
  ['client/src/types/dto/tte.dto.ts', [/export type TTERole/]],
  ['client/e2e/fixtures/users.ts', [/\bKEPALA_OPD\b/, /\bPJ_EVALUATOR\b/, /\bPJ_PENYUSUN\b/, /\bEVALUATOR\b/, /\bPENYUSUN\b/]],
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
