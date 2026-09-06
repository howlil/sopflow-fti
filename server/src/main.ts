import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import { createServer } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createDefaultValidationPipe } from './common';
import { installFatalProcessErrorHandlers } from './common/bootstrap/process-error-handlers';
import { buildCorsOptions } from './common/http/cors-options';
import { JSON_BODY_LIMIT, URLENCODED_BODY_LIMIT } from './common/http/request-body-limits';
import { WinstonLoggerConfig } from './common/logger/winston.config';
import { CsrfProtectionService } from './common/security/csrf-protection.service';
import { installSecurityHttpMiddleware } from './common/security/security-http.middleware';
import {
  SecurityRateLimiterService,
  shouldApplySecurityRateLimit,
} from './common/security/security-rate-limiter.service';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from './modules/core/auth/helpers/auth.shared';

const DEFAULT_PORT = 3001;

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function bootstrap() {
  const logger = WinstonModule.createLogger(WinstonLoggerConfig);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const e2eCritical = configService.get<boolean>('E2E_CRITICAL', false);

  app.useBodyParser('json', {
    limit: JSON_BODY_LIMIT,
  });
  app.useBodyParser('urlencoded', { extended: true, limit: URLENCODED_BODY_LIMIT });
  app.use(cookieParser());

  installSecurityHttpMiddleware(
    app,
    app.get(CsrfProtectionService),
    app.get(SecurityRateLimiterService),
    shouldApplySecurityRateLimit(nodeEnv, e2eCritical),
  );
  installFatalProcessErrorHandlers(logger);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(createDefaultValidationPipe());
  app.enableCors(buildCorsOptions(configService));

  const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', nodeEnv !== 'production');
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('SOPFlow FTI API')
      .setDescription('API lifecycle SOP Fakultas Teknologi Informasi berbasis Proses Bisnis')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
      .addCookieAuth(REFRESH_TOKEN_COOKIE_NAME)
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Process', 'Proses Bisnis dan membership kontekstual')
      .addTag('Organizational Authority', 'Kewenangan Dekan dan Ketua Jurusan')
      .addTag('SOP', 'Authoring dan lifecycle SOP berbasis Proses Bisnis')
      .addTag('TTE', 'Tanda tangan elektronik kontekstual')
      .addTag('Users', 'Platform account management')
      .addTag('Health', 'Health check')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.enableShutdownHooks();

  const configuredPort = configService.get<number>('PORT', DEFAULT_PORT);
  if (!(await isPortAvailable(configuredPort))) {
    const recoveryHint =
      nodeEnv === 'development'
        ? ` Hentikan proses lain (PowerShell: netstat -ano | findstr :${configuredPort}, lalu taskkill /PID <pid> /F), lalu jalankan ulang pnpm start:dev.`
        : ' Server production tidak akan memilih port alternatif agar load balancer/service discovery tidak salah target.';
    logger.error(`Port ${configuredPort} sudah dipakai.${recoveryHint}`);
    process.exit(1);
  }

  await app.listen(configuredPort, '0.0.0.0');
  logger.log(`🚀 Server running on http://localhost:${configuredPort}/api`);
  if (swaggerEnabled) {
    logger.log(`📚 Swagger docs: http://localhost:${configuredPort}/docs`);
  }
  logger.log(`💚 Liveness: http://localhost:${configuredPort}/api/health/live`);
  logger.log(`✅ Readiness: http://localhost:${configuredPort}/api/health/ready`);
}

void bootstrap();
