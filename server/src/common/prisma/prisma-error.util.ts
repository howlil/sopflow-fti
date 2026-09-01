type PrismaErrorLike = Readonly<{ code?: unknown }>;

function hasStringCode(error: unknown): error is PrismaErrorLike & { code: string } {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}

/** Memeriksa kode error Prisma tanpa membocorkan kelas runtime Prisma ke service domain. */
export function hasPrismaErrorCode(error: unknown, codes: readonly string[]): boolean {
  return hasStringCode(error) && codes.includes(error.code);
}

/** Shortcut untuk konflik unique constraint Prisma (P2002). */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return hasPrismaErrorCode(error, ['P2002']);
}
