/** Isi muatan data JWT akses (sesuai yang ditandatangani di layanan auth). */
export type JwtAccessPayload = {
  readonly sub: string;
  readonly email: string;
  readonly sesiTokenVersion?: number;
};
