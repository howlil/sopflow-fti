process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'fti-e2e-jwt-secret-only-for-disposable-test-runs';
process.env.TTE_ENCRYPTION_SECRET =
  process.env.TTE_ENCRYPTION_SECRET ?? 'fti-e2e-tte-secret-only-for-disposable-test-runs';
process.env.SEED_DEFAULT_PASSWORD =
  process.env.SEED_DEFAULT_PASSWORD ?? process.env.E2E_SEED_PASSWORD ?? '@Password123:)';

async function bootstrap(): Promise<void> {
  const [{ NestFactory }, { SeedModule }, { SeedService }] = await Promise.all([
    import('@nestjs/core'),
    import('../src/database/seed/seed.module'),
    import('../src/database/seed/seed.service'),
  ]);

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const seedService = app.get(SeedService);
    await seedService.run();
  } finally {
    await app.close();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
