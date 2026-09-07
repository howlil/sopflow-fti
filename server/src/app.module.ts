import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { CommonModule } from './common/common.module';
import { WinstonLoggerConfig } from './common/logger/winston.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/core/auth/auth.module';
import { PenggunaModule } from './modules/core/pengguna/pengguna.module';
import { PeraturanModule } from './modules/core/peraturan/peraturan.module';
import { ProsesBisnisModule } from './modules/core/proses-bisnis/proses-bisnis.module';
import { SopCatalogModule } from './modules/sop/catalog/sop-catalog.module';
import { SopProsedurModule } from './modules/sop/prosedur/sop-prosedur.module';
import { SopDiagramModule } from './modules/sop/diagram/sop-diagram.module';
import { SopPublicModule } from './modules/sop/public/sop-public.module';
import { PelaksanaModule } from './modules/sop/pelaksana/pelaksana.module';
import { ProsesBisnisSopAuthoringModule } from './modules/sop/penyusunan-proses-bisnis/sop-proses-bisnis-authoring.module';
import { TteSharedModule } from './modules/tte/shared/tte-shared.module';
import { TteProfilModule } from './modules/tte/profil/tte-profil.module';
import { TtePenandatangananModule } from './modules/tte/penandatanganan/tte-penandatanganan.module';
import { TteVerifikasiModule } from './modules/tte/verifikasi/tte-verifikasi.module';
import { TteCoreModule } from './modules/tte/core/tte-core.module';
import { NotifikasiProsesBisnisModule } from './modules/notifications/proses-bisnis/notifikasi-proses-bisnis.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env.local',
        '.env',
      ],
      validate: validateEnv,
    }),
    WinstonModule.forRoot(WinstonLoggerConfig),
    PrismaModule,
    AuthModule,
    PenggunaModule,
    ProsesBisnisModule,
    SopCatalogModule,
    ProsesBisnisSopAuthoringModule,
    SopPublicModule,
    SopProsedurModule,
    SopDiagramModule,
    PeraturanModule,
    PelaksanaModule,
    TteSharedModule,
    TteProfilModule,
    TtePenandatangananModule,
    TteVerifikasiModule,
    TteCoreModule,
    NotifikasiProsesBisnisModule,
  ],
})
export class AppModule {}
