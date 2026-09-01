import { hasPrismaErrorCode, isPrismaUniqueConstraintError } from './prisma-error.util';

describe('prisma-error.util', () => {
  it('mengenali P2002 sebagai unique constraint error', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2002' })).toBe(true);
  });

  it('menolak error non-P2002 sebagai unique constraint error', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2025' })).toBe(false);
    expect(isPrismaUniqueConstraintError(new Error('P2002'))).toBe(false);
  });

  it('mengenali salah satu kode Prisma yang diizinkan', () => {
    expect(hasPrismaErrorCode({ code: 'P2003' }, ['P2003', 'P2025'])).toBe(true);
    expect(hasPrismaErrorCode({ code: 'P2034' }, ['P2003', 'P2025'])).toBe(false);
  });
});
