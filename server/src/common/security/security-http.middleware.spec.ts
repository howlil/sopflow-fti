import type { Request } from 'express';
import type { SecurityRateLimitPolicy } from './security-rate-limiter.service';
import {
  resolveClientNetworkIdentifier,
  resolveLoginEmail,
  resolveRateLimitIdentifier,
} from './security-http.middleware';

function request(input: Partial<Request>): Request {
  return input as Request;
}

describe('security-http.middleware identifiers', () => {
  it('mengutamakan IP pertama dari x-forwarded-for', () => {
    const req = request({
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' } as never,
    });

    expect(resolveClientNetworkIdentifier(req)).toBe('203.0.113.10');
  });

  it('menggunakan access token cookie sebagai identifier endpoint TTE sensitif', () => {
    const policy: SecurityRateLimitPolicy = {
      scope: 'tte-sensitive',
      limit: 20,
      windowMs: 60_000,
    };
    const req = request({
      headers: {},
      cookies: { access_token: 'session-token' },
      socket: { remoteAddress: '127.0.0.1' } as never,
    });

    expect(resolveRateLimitIdentifier(req, policy)).toBe('session:session-token');
  });

  it('menormalisasi email login untuk account rate limit', () => {
    const req = request({ body: { email: ' User@Example.COM ' } });
    expect(resolveLoginEmail(req)).toBe('user@example.com');
  });
});
