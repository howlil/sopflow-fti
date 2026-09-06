import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SeedService } from './seed.service';

export type InitialSeedResult = 'seeded' | 'skipped';

/** Menjalankan data demo hanya untuk database aplikasi FTI yang benar-benar kosong. */
@Injectable()
export class InitialSeedService {
  private readonly logger = new Logger(InitialSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seedService: SeedService,
  ) {}

  async runIfDatabaseEmpty(): Promise<InitialSeedResult> {
    const [penggunaCount, processCount, departmentCount, peraturanCount, pelaksanaCount] =
      await Promise.all([
        this.prisma.pengguna.count(),
        this.prisma.process.count(),
        this.prisma.department.count(),
        this.prisma.peraturan.count(),
        this.prisma.pelaksana.count(),
      ]);

    const existingDomainRows =
      penggunaCount + processCount + departmentCount + peraturanCount + pelaksanaCount;
    if (existingDomainRows > 0) {
      this.logger.log(
        `Seed awal dilewati karena database sudah berisi ${existingDomainRows} baris domain utama.`,
      );
      return 'skipped';
    }

    this.logger.log('Database domain FTI kosong. Menjalankan seed awal.');
    await this.seedService.run();
    return 'seeded';
  }
}
