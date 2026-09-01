import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SeedService } from './seed.service';

export type InitialSeedResult = 'seeded' | 'skipped';

/**
 * Menjalankan data demo hanya untuk database aplikasi yang benar-benar kosong.
 *
 * Guard ini sengaja konservatif: bila salah satu tabel domain utama sudah berisi
 * data, seed dilewati agar redeploy tidak menimpa data atau password pengguna.
 */
@Injectable()
export class InitialSeedService {
  private readonly logger = new Logger(InitialSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seedService: SeedService,
  ) {}

  async runIfDatabaseEmpty(): Promise<InitialSeedResult> {
    const [penggunaCount, opdCount, peraturanCount, pelaksanaCount] = await Promise.all([
      this.prisma.pengguna.count(),
      this.prisma.oPD.count(),
      this.prisma.peraturan.count(),
      this.prisma.pelaksana.count(),
    ]);

    const existingDomainRows = penggunaCount + opdCount + peraturanCount + pelaksanaCount;
    if (existingDomainRows > 0) {
      this.logger.log(
        `Seed awal dilewati karena database sudah berisi ${existingDomainRows} baris domain utama.`,
      );
      return 'skipped';
    }

    this.logger.log('Database domain kosong. Menjalankan seed awal.');
    await this.seedService.run();
    return 'seeded';
  }
}
