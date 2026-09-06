import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const nativeRuntimeFiles = [
  'process-sop-authoring.service.ts',
  'process-owner-review.service.ts',
  'process-final-approval.service.ts',
  'process-sop-revocation.service.ts',
  'process-version.service.ts',
  '../prosedur/sop-prosedur.service.ts',
  '../diagram/sop-diagram.service.ts',
  '../../tte/penandatanganan/process-tte.service.ts',
  '../../tte/penandatanganan/process-tte.repository.ts',
] as const;

const nativeModuleFiles = [
  './process-sop-authoring.module.ts',
  '../prosedur/sop-prosedur.module.ts',
  '../diagram/sop-diagram.module.ts',
  '../../tte/penandatanganan/tte-penandatanganan.module.ts',
] as const;

const forbiddenRuntimePatterns = [
  /\bUserOpdAccessService\b/,
  /\bSopLegacyAccessPolicy\b/,
  /\bSopLegacyVersionCompatibility(?:Module|Service)?\b/,
  /\bRolesGuard\b/,
  /\bUseJwtAndRolesGuards\b/,
  /\buser\.peran\b/,
  /\buser\.opdId\b/,
  /\buserOpdId\b/,
  /\bassertWorkbenchAccess\b/,
  /\bPengajuanEvaluasi\b/,
  /\bNilaiEvaluasi\b/,
  /\bLogNilaiEvaluasi\b/,
  /\bPengingatWhatsApp\b/,
  /\bNotificationReminder(?:Repository|Scheduler|Reconciler|Service)?\b/,
] as const;

describe('Native FTI runtime boundaries', () => {
  it('keeps native workflow runtime independent from legacy authorization and workflows', () => {
    const violations = nativeRuntimeFiles.flatMap((relativePath) => {
      const source = readFileSync(join(__dirname, relativePath), 'utf8');
      return forbiddenRuntimePatterns.flatMap((pattern) =>
        pattern.test(source) ? [`${relativePath}:${pattern}`] : [],
      );
    });
    expect(violations).toEqual([]);
  });

  it('keeps native modules free of legacy runtime imports', () => {
    for (const relativePath of nativeModuleFiles) {
      const source = readFileSync(join(__dirname, relativePath), 'utf8');
      expect(source).not.toContain('OpdModule');
      expect(source).not.toContain('SopCatalogModule');
      expect(source).not.toContain('SopLegacyVersionCompatibilityModule');
      expect(source).not.toMatch(/\bNotificationModule\b/);
      expect(forbiddenRuntimePatterns.filter((pattern) => pattern.test(source))).toEqual([]);
    }

    const authoringSource = readFileSync(
      join(__dirname, './process-sop-authoring.module.ts'),
      'utf8',
    );
    expect(authoringSource).toContain('ProcessNotificationModule');

    const processNotificationSource = readFileSync(
      join(__dirname, '../../notifications/process/process-notification.module.ts'),
      'utf8',
    );
    expect(processNotificationSource).toContain('ProcessNotificationService');
    expect(processNotificationSource).not.toContain('NotificationReminder');
    expect(processNotificationSource).not.toContain('PengajuanEvaluasi');
  });
});
