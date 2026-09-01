import type { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { buildCorsOptions } from './cors-options';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;
type CorsOriginResolver = (origin: string | undefined, callback: CorsOriginCallback) => void;

function buildConfig(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

function resolveOrigin(
  options: CorsOptions,
  origin: string | undefined,
): Promise<boolean | undefined> {
  if (typeof options.origin !== 'function') {
    return Promise.resolve(options.origin === true ? true : undefined);
  }
  const originResolver = options.origin as CorsOriginResolver;
  return new Promise((resolve, reject) => {
    originResolver(origin, (error, allow) => {
      if (error !== null) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve(allow);
    });
  });
}

describe('buildCorsOptions', () => {
  it('mengizinkan semua origin di luar production', () => {
    const options = buildCorsOptions(buildConfig({ NODE_ENV: 'development' }));
    expect(options.origin).toBe(true);
  });

  it('mengizinkan origin production yang terdaftar setelah normalisasi', async () => {
    const options = buildCorsOptions(
      buildConfig({
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://app.example.com/,https://admin.example.com',
        PUBLIC_APP_ORIGIN: 'https://public.example.com/path',
      }),
    );

    await expect(resolveOrigin(options, 'https://app.example.com')).resolves.toBe(true);
    await expect(resolveOrigin(options, 'https://public.example.com')).resolves.toBe(true);
  });

  it('menolak origin production yang tidak terdaftar', async () => {
    const options = buildCorsOptions(
      buildConfig({ NODE_ENV: 'production', ALLOWED_ORIGINS: 'https://app.example.com' }),
    );

    await expect(resolveOrigin(options, 'https://evil.example.com')).resolves.toBe(false);
  });

  it('tetap mengizinkan request internal tanpa Origin', async () => {
    const options = buildCorsOptions(buildConfig({ NODE_ENV: 'production' }));
    await expect(resolveOrigin(options, undefined)).resolves.toBe(true);
  });
});
