import { validateEnv } from './env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  JWT_SECRET: '12345678901234567890123456789012',
  TTE_ENCRYPTION_SECRET: 'tte-secret-that-is-different-and-long-enough-123456',
  DATABASE_PASSWORD: 'test',
  PDF_SIGNING_ENABLED: 'false',
};

describe('Environment validation', () => {
  it('menggunakan default database untuk deployment sederhana', () => {
    expect(validateEnv(baseEnv)).toMatchObject({
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 3306,
      DATABASE_USER: 'sop_app',
      DATABASE_NAME: 'sop_biro_organisasi',
      DATABASE_PASSWORD: 'test',
    });
  });

  it('tetap menerima database eksplisit untuk CI dan test lokal', () => {
    expect(
      validateEnv({
        ...baseEnv,
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: '3308',
        DATABASE_USER: 'sop_test',
        DATABASE_NAME: 'sop_biro_organisasi_test',
      }),
    ).toMatchObject({
      DATABASE_HOST: '127.0.0.1',
      DATABASE_PORT: 3308,
      DATABASE_USER: 'sop_test',
      DATABASE_NAME: 'sop_biro_organisasi_test',
    });
  });

  it('menormalkan spasi dari environment deployment', () => {
    expect(
      validateEnv({
        ...baseEnv,
        PUBLIC_APP_ORIGIN: 'https://sop.example.test     ',
        ALLOWED_ORIGINS: 'https://sop.example.test     ',
        SOP_PDF_STORAGE_DIR: '/app/storage/sop-pdf     ',
      }),
    ).toMatchObject({
      PUBLIC_APP_ORIGIN: 'https://sop.example.test',
      ALLOWED_ORIGINS: 'https://sop.example.test',
      SOP_PDF_STORAGE_DIR: '/app/storage/sop-pdf',
    });
  });

  it('menormalkan flag critical E2E dan default-nya nonaktif', () => {
    expect(validateEnv(baseEnv)).toMatchObject({ E2E_CRITICAL: false });
    expect(validateEnv({ ...baseEnv, E2E_CRITICAL: 'true' })).toMatchObject({
      E2E_CRITICAL: true,
    });
  });

  it('mengaktifkan notifikasi in-app secara default', () => {
    expect(validateEnv(baseEnv)).toMatchObject({
      NOTIFICATION_IN_APP_ENABLED: true,
      NOTIFICATION_RECONCILE_INTERVAL_SECONDS: 10,
    });
  });

  it('menerima PDF signing nonaktif tanpa P12 global server', () => {
    expect(
      validateEnv({
        ...baseEnv,
        PDF_SIGNING_ENABLED: 'false',
        PDF_SIGNING_P12_BASE64: '',
      }),
    ).toMatchObject({ PDF_SIGNING_ENABLED: false });
  });

  it('menolak TTE encryption secret yang sama dengan JWT secret', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        TTE_ENCRYPTION_SECRET: baseEnv.JWT_SECRET,
      }),
    ).toThrow(/berbeda dari JWT_SECRET/);
  });

  it('mewajibkan refresh secret dan origin eksplisit pada production', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
      }),
    ).toThrow(/JWT_REFRESH_SECRET|PUBLIC_APP_ORIGIN/);
  });

  it('mewajibkan PUBLIC_APP_ORIGIN pada production walaupun ALLOWED_ORIGINS diisi', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters-long',
        ALLOWED_ORIGINS: 'https://sop.example.test',
      }),
    ).toThrow(/PUBLIC_APP_ORIGIN/);
  });

  it('menolak wildcard origin pada production dengan cookie credentials', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters-long',
        PUBLIC_APP_ORIGIN: 'https://sop.example.test',
        ALLOWED_ORIGINS: '*',
      }),
    ).toThrow(/Wildcard origin/);
  });

  it('menerima konfigurasi production yang eksplisit', () => {
    expect(
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters-long',
        PUBLIC_APP_ORIGIN: 'https://sop.example.test',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      PUBLIC_APP_ORIGIN: 'https://sop.example.test',
      ALLOWED_ORIGINS: '',
      SWAGGER_ENABLED: false,
    });
  });
});
