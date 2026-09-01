import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { validateEnv } from '../../config/env.validation';
import { InitialSeedService } from './initial-seed.service';
import { SeedService } from './seed.service';

/**
 * Modul ringkas untuk menjalankan seed di luar HTTP server.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
      ],
      validate: validateEnv,
    }),
    PrismaModule,
  ],
  providers: [SeedService, InitialSeedService],
})
export class SeedModule {}
