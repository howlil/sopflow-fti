import { ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { JenisDokumenTte, Prisma } from '../../../../generated/prisma';

export function hashDokumenKanonik(params: {
  jenis: JenisDokumenTte;
  nomorDokumen: string;
  judulDokumen: string;
  refId: string;
}): string {
  const canonical = [
    params.jenis,
    params.refId,
    params.nomorDokumen.trim(),
    params.judulDokumen.trim(),
  ].join('|');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export async function runTteRepositoryMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.map(String).join(',')
        : String(err.meta?.target ?? '');
      if (target.includes('nomorDokumen')) {
        throw new ConflictException('Nomor dokumen sudah digunakan');
      }
    }
    throw err;
  }
}
