import { NestFactory } from '@nestjs/core';
import { InitialSeedService } from './initial-seed.service';
import { SeedModule } from './seed.module';

/**
 * Entrypoint production untuk seed awal. File berada di src agar ikut dikompilasi
 * oleh Nest build dan tidak membutuhkan ts-node/devDependencies di runtime image.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const initialSeedService = app.get(InitialSeedService);
    await initialSeedService.runIfDatabaseEmpty();
  } finally {
    await app.close();
  }
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
