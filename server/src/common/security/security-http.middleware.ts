import type { NextFunction, Request } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../modules/core/auth/helpers/auth.shared';
import { CsrfProtectionService } from './csrf-protection.service';
import {
  SecurityRateLimiterService,
  resolveSecurityRateLimitPolicy,
  type SecurityRateLimitPolicy,
} from './security-rate-limiter.service';

const LOGIN_ACCOUNT_RATE_LIMIT: SecurityRateLimitPolicy = {
  scope: 'auth-login-account',
  limit: 10,
  windowMs: 15 * 60_000,
};

export function resolveClientNetworkIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const realIp = req.headers['x-real-ip'];
  const firstRealIp = Array.isArray(realIp) ? realIp[0] : realIp;
  return (
    firstForwarded?.trim() ||
    firstRealIp?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown-client'
  );
}

function getCookie(req: Request, name: string): string | undefined {
  const cookies: unknown = req.cookies;
  if (typeof cookies !== 'object' || cookies === null) {
    return undefined;
  }
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

export function resolveRateLimitIdentifier(req: Request, policy: SecurityRateLimitPolicy): string {
  if (policy.scope === 'tte-sensitive' || policy.scope === 'tte-setup') {
    const accessToken = getCookie(req, ACCESS_TOKEN_COOKIE_NAME);
    if (accessToken !== undefined) {
      return `session:${accessToken}`;
    }
  }
  return `network:${resolveClientNetworkIdentifier(req)}`;
}

export function resolveLoginEmail(req: Request): string | undefined {
  const body: unknown = req.body;
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const email = (body as Record<string, unknown>).email;
  return typeof email === 'string' && email.trim() !== '' ? email.trim().toLowerCase() : undefined;
}

/** Memasang CSRF dan rate-limit middleware tanpa menaruh detail identifikasi request di bootstrap. */
export function installSecurityHttpMiddleware(
  app: NestExpressApplication,
  csrfProtection: CsrfProtectionService,
  rateLimiter: SecurityRateLimiterService,
  applyRateLimit = true,
): void {
  app.use((req: Request, _res: unknown, next: NextFunction) => {
    try {
      csrfProtection.assertRequest(req);
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use((req: Request, _res: unknown, next: NextFunction) => {
    if (!applyRateLimit) {
      next();
      return;
    }
    const policy = resolveSecurityRateLimitPolicy(req.method, req.path);
    if (policy === null) {
      next();
      return;
    }
    try {
      rateLimiter.consume(policy, resolveRateLimitIdentifier(req, policy));
      if (policy.scope === 'auth-login-ip') {
        const email = resolveLoginEmail(req);
        if (email !== undefined) {
          rateLimiter.consume(LOGIN_ACCOUNT_RATE_LIMIT, email);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });
}
