import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Boundary PengajuanEvaluasiService', () => {
  const serviceSource = readFileSync(join(__dirname, 'pengajuan-evaluasi.service.ts'), 'utf8');

  it('seharusnya tidak mengetahui Prisma.TransactionClient', () => {
    expect(serviceSource).not.toContain('Prisma.TransactionClient');
  });

  it('seharusnya tidak menjalankan callback transaksi repository', () => {
    expect(serviceSource).not.toContain('.runTransaction(');
  });

  it('seharusnya tidak mengimpor Prisma ORM untuk operasi database', () => {
    expect(serviceSource).not.toMatch(/\bPrisma\b/);
  });
});
