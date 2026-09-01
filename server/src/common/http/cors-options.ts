import type { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const CORS_MAX_AGE_SECONDS = 3600;

function normalizeCorsOrigin(origin: string | undefined): string {
  const value = origin?.trim();
  if (!value) {
    return '';
  }
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
}

/** Membangun policy CORS aplikasi dari konfigurasi environment. */
export function buildCorsOptions(configService: ConfigService): CorsOptions {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const allowedOriginsRaw = configService.get<string>('ALLOWED_ORIGINS', '').trim();
  const publicAppOrigin = configService.get<string>('PUBLIC_APP_ORIGIN', '').trim();
  const allowAllOrigins = nodeEnv !== 'production';
  const allowedOrigins = new Set(
    [...allowedOriginsRaw.split(','), publicAppOrigin].map(normalizeCorsOrigin).filter(Boolean),
  );
  return {
    origin: allowAllOrigins
      ? true
      : (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
          if (!origin || allowedOrigins.has(normalizeCorsOrigin(origin))) {
            callback(null, true);
            return;
          }
          callback(null, false);
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-CSRF-Token'],
    credentials: true,
    maxAge: CORS_MAX_AGE_SECONDS,
  };
}
