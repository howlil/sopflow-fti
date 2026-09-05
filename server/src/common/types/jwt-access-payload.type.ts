import type { PeranPengguna } from '../../generated/prisma';

/**
 * Native claims signed into the access JWT are `sub`, `email`, and session version only.
 * `peran` is optional runtime compatibility metadata: RolesGuard may hydrate it from
 * persistence for an explicit `@Roles(...)` legacy endpoint. It is never signed into
 * the token and native FTI workflow must not use it for authorization.
 */
export type JwtAccessPayload = {
  readonly sub: string;
  readonly email: string;
  readonly sesiTokenVersion?: number;
  peran?: PeranPengguna;
};
