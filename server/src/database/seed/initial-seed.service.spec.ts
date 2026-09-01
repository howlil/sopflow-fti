import { InitialSeedService } from './initial-seed.service';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { SeedService } from './seed.service';

describe('InitialSeedService', () => {
  function createSubject(
    counts: {
      pengguna?: number;
      opd?: number;
      peraturan?: number;
      pelaksana?: number;
    } = {},
  ) {
    const prisma = {
      pengguna: { count: jest.fn().mockResolvedValue(counts.pengguna ?? 0) },
      oPD: { count: jest.fn().mockResolvedValue(counts.opd ?? 0) },
      peraturan: { count: jest.fn().mockResolvedValue(counts.peraturan ?? 0) },
      pelaksana: { count: jest.fn().mockResolvedValue(counts.pelaksana ?? 0) },
    } as unknown as PrismaService;
    const seedRun = jest.fn().mockResolvedValue(undefined);
    const seed = { run: seedRun } as unknown as SeedService;

    return {
      subject: new InitialSeedService(prisma, seed),
      seedRun,
    };
  }

  it('runs the demo seed when all seeded domain tables are empty', async () => {
    const { subject, seedRun } = createSubject();

    await expect(subject.runIfDatabaseEmpty()).resolves.toBe('seeded');
    expect(seedRun).toHaveBeenCalledTimes(1);
  });

  it('skips the demo seed when the database already contains domain data', async () => {
    const { subject, seedRun } = createSubject({ pengguna: 1 });

    await expect(subject.runIfDatabaseEmpty()).resolves.toBe('skipped');
    expect(seedRun).not.toHaveBeenCalled();
  });
});
