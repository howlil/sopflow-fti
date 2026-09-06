import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { TteRepository } from './tte.repository';

describe('TteRepository current identity boundary', () => {
  it('loads active signer identity without current role or OPD shadow', async () => {
    const prisma = {
      pengguna: {
        findFirst: jest.fn().mockResolvedValue({
          penggunaId: 'u-1',
          email: 'signer@fti.test',
          nama: 'Signer',
          nip: '198001010000000001',
          jabatan: 'Dekan',
          pangkat: 'Pembina',
        }),
      },
    };
    const repo = new TteRepository(prisma as unknown as PrismaService);

    await expect(repo.findPenggunaAktif('u-1')).resolves.toEqual({
      penggunaId: 'u-1',
      email: 'signer@fti.test',
      nama: 'Signer',
      nip: '198001010000000001',
      jabatan: 'Dekan',
      pangkat: 'Pembina',
    });

    expect(prisma.pengguna.findFirst).toHaveBeenCalledWith({
      where: { penggunaId: 'u-1', deletedAt: null },
      select: expect.not.objectContaining({
        peran: expect.anything(),
        opdId: expect.anything(),
        opd: expect.anything(),
      }),
    });
  });
});
