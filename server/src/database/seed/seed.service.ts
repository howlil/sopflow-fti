import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PeranPengguna } from '../../generated/prisma';

const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_SEED_PASSWORD = '@Password123:)';

const SEED_OPD_PJ_EVALUATOR = 'Biro Organisasi Sekretariat Daerah';
const SEED_OPD_DINKES = 'Dinas Kesehatan Provinsi';
const SEED_OPD_DISDIK = 'Dinas Pendidikan Provinsi';

interface SeedUserInput {
  readonly email: string;
  readonly nama: string;
  readonly peran: PeranPengguna;
  readonly nip: string;
  readonly jabatan: string;
  readonly pangkat: string;
  readonly nohp: string;
  readonly opdKey: string;
}

interface SeedPeraturanInput {
  readonly nomor: string;
  readonly tahun: number;
  readonly nama: string;
  readonly tentang: string;
}

interface SeedUserRecord extends Omit<SeedUserInput, 'opdKey'> {
  readonly penggunaId: string;
  readonly opdId: string;
}

const SEED_USERS: ReadonlyArray<SeedUserInput> = [
  {
    email: 'pjevaluator@gmail.com',
    nama: 'Dr. Bambang Suryono, M.Si.',
    peran: PeranPengguna.PJ_EVALUATOR,
    nip: '198501012009011000',
    jabatan: 'Koordinator Evaluasi SOP',
    pangkat: 'Pembina',
    nohp: '6281234567890',
    opdKey: SEED_OPD_PJ_EVALUATOR,
  },
  {
    email: 'evaluator1@gmail.com',
    nama: 'Siti Rahmawati, S.STP',
    peran: PeranPengguna.EVALUATOR,
    nip: '198501012009011001',
    jabatan: 'Evaluator Madya',
    pangkat: 'Pembina',
    nohp: '6281234567891',
    opdKey: SEED_OPD_PJ_EVALUATOR,
  },
  {
    email: 'kepalaopd.dinkes@gmail.com',
    nama: 'dr. Hendra Wijaya, Sp.OG',
    peran: PeranPengguna.KEPALA_OPD,
    nip: '198501012009011005',
    jabatan: 'Kepala OPD Dinkes',
    pangkat: 'Pembina Utama Muda',
    nohp: '6281234567895',
    opdKey: SEED_OPD_DINKES,
  },
  {
    email: 'pjpenyusun.dinkes@gmail.com',
    nama: 'Dewi Kartika, S.Kep',
    peran: PeranPengguna.PJ_PENYUSUN,
    nip: '198501012009011003',
    jabatan: 'Koordinator Penyusunan SOP Dinkes',
    pangkat: 'Pembina',
    nohp: '6281234567893',
    opdKey: SEED_OPD_DINKES,
  },
  {
    email: 'penyusun.dinkes@gmail.com',
    nama: 'Budi Santoso, A.Md.Kep',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011004',
    jabatan: 'Analis SOP Dinkes',
    pangkat: 'Penata',
    nohp: '6281234567894',
    opdKey: SEED_OPD_DINKES,
  },
  {
    email: 'kepalaopd.disdik@gmail.com',
    nama: 'Drs. Agus Harimurti, M.Pd.',
    peran: PeranPengguna.KEPALA_OPD,
    nip: '198501012009011011',
    jabatan: 'Kepala Dinas Pendidikan Provinsi',
    pangkat: 'Pembina Utama Muda',
    nohp: '6281234567801',
    opdKey: SEED_OPD_DISDIK,
  },
  {
    email: 'pjpenyusun.disdik@gmail.com',
    nama: 'Rina Permata, S.Pd.',
    peran: PeranPengguna.PJ_PENYUSUN,
    nip: '198501012009011009',
    jabatan: 'Koordinator Penyusunan SOP Disdik',
    pangkat: 'Pembina',
    nohp: '6281234567899',
    opdKey: SEED_OPD_DISDIK,
  },
  {
    email: 'penyusun.disdik@gmail.com',
    nama: 'Ahmad Hidayat, M.Pd.',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011010',
    jabatan: 'Analis SOP Disdik',
    pangkat: 'Penata',
    nohp: '6281234567800',
    opdKey: SEED_OPD_DISDIK,
  },
];

const SEED_PERATURAN: ReadonlyArray<SeedPeraturanInput> = [
  {
    nomor: '12 Tahun 2024',
    tahun: 2024,
    nama: 'Peraturan Daerah Tata Kelola SOP',
    tentang: 'Pedoman tata kelola penyusunan dan evaluasi SOP di lingkungan pemerintah daerah.',
  },
  {
    nomor: '7 Tahun 2023',
    tahun: 2023,
    nama: 'Peraturan Gubernur Transformasi Layanan',
    tentang: 'Percepatan transformasi layanan publik berbasis prosedur baku dan digitalisasi.',
  },
  {
    nomor: '35 Tahun 2012',
    tahun: 2012,
    nama: 'Peraturan MenPAN-RB Nomor 35 Tahun 2012',
    tentang: 'Pedoman penyusunan standar operasional prosedur administrasi pemerintahan.',
  },
  {
    nomor: '15 Tahun 2022',
    tahun: 2022,
    nama: 'Peraturan Gubernur Pelayanan Publik Berkualitas',
    tentang:
      'Penyelenggaraan pelayanan publik berkualitas dan berorientasi pada kepuasan masyarakat.',
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async run(): Promise<void> {
    const plainPassword = this.config.get<string>('SEED_DEFAULT_PASSWORD', DEFAULT_SEED_PASSWORD);
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      const opdPjEvaluator = await this.ensureOpd(tx, SEED_OPD_PJ_EVALUATOR);
      const opdDinkes = await this.ensureOpd(tx, SEED_OPD_DINKES);
      const opdDisdik = await this.ensureOpd(tx, SEED_OPD_DISDIK);

      const opdIdMap: Record<string, string> = {
        [SEED_OPD_PJ_EVALUATOR]: opdPjEvaluator.opdId,
        [SEED_OPD_DINKES]: opdDinkes.opdId,
        [SEED_OPD_DISDIK]: opdDisdik.opdId,
      };

      const users = await this.seedUsers(tx, hashedPassword, opdIdMap);
      await this.seedRiwayatOpd(tx, Object.values(users));

      const peraturan = await this.seedPeraturan(
        tx,
        users['pjpenyusun.dinkes@gmail.com'].penggunaId,
      );
      await this.seedOpdPeraturan(tx, {
        opdDinkesId: opdDinkes.opdId,
        opdDisdikId: opdDisdik.opdId,
        peraturanDaerahId: peraturan['12 Tahun 2024'].peraturanId,
        permenpanId: peraturan['35 Tahun 2012'].peraturanId,
        pergubLayananId: peraturan['15 Tahun 2022'].peraturanId,
      });
      await this.seedPelaksana(tx, {
        opdDinkesId: opdDinkes.opdId,
        opdDisdikId: opdDisdik.opdId,
      });
    });

    this.logger.log(
      [
        'Seed selesai.',
        'Cakupan master data: 3 OPD, 8 pengguna, riwayat OPD aktif,',
        '4 peraturan, relasi OPD-peraturan, dan master pelaksana SOP.',
      ].join(' '),
    );
    this.logger.warn(
      `Login seed menggunakan SEED_DEFAULT_PASSWORD (default ${DEFAULT_SEED_PASSWORD}).`,
    );
  }

  private async ensureOpd(tx: Prisma.TransactionClient, nama: string): Promise<{ opdId: string }> {
    const existing = await tx.oPD.findFirst({
      where: { nama },
      select: { opdId: true },
    });
    if (existing !== null) {
      return existing;
    }
    return tx.oPD.create({
      data: { nama },
      select: { opdId: true },
    });
  }

  private async seedUsers(
    tx: Prisma.TransactionClient,
    hashedPassword: string,
    opdIdMap: Record<string, string>,
  ): Promise<Record<string, SeedUserRecord>> {
    const result: Record<string, SeedUserRecord> = {};
    for (const user of SEED_USERS) {
      const opdId = opdIdMap[user.opdKey];
      const persisted = await tx.pengguna.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          opdId,
          nama: user.nama,
          kataSandi: hashedPassword,
          peran: user.peran,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
        },
        update: {
          opdId,
          nama: user.nama,
          kataSandi: hashedPassword,
          peran: user.peran,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
          deletedAt: null,
        },
        select: {
          penggunaId: true,
          opdId: true,
          email: true,
          nama: true,
          peran: true,
          nip: true,
          jabatan: true,
          pangkat: true,
          nohp: true,
        },
      });
      result[user.email] = { ...persisted, opdId: persisted.opdId! };
    }
    return result;
  }

  private async seedRiwayatOpd(
    tx: Prisma.TransactionClient,
    users: ReadonlyArray<SeedUserRecord>,
  ): Promise<void> {
    for (const user of users) {
      await tx.riwayatOpdPengguna.upsert({
        where: {
          penggunaId_opdId: {
            penggunaId: user.penggunaId,
            opdId: user.opdId,
          },
        },
        create: {
          penggunaId: user.penggunaId,
          opdId: user.opdId,
          isAktif: true,
        },
        update: { isAktif: true },
      });
    }
  }

  private async seedPeraturan(
    tx: Prisma.TransactionClient,
    lastEditedById: string,
  ): Promise<Record<string, { peraturanId: string }>> {
    const result: Record<string, { peraturanId: string }> = {};
    for (const peraturan of SEED_PERATURAN) {
      const persisted = await tx.peraturan.upsert({
        where: {
          nomor_tahun: {
            nomor: peraturan.nomor,
            tahun: peraturan.tahun,
          },
        },
        create: {
          nama: peraturan.nama,
          nomor: peraturan.nomor,
          tahun: peraturan.tahun,
          tentang: peraturan.tentang,
          lastEditedById,
        },
        update: {
          nama: peraturan.nama,
          tentang: peraturan.tentang,
          lastEditedById,
        },
        select: { peraturanId: true },
      });
      result[peraturan.nomor] = persisted;
    }
    return result;
  }

  private async seedOpdPeraturan(
    tx: Prisma.TransactionClient,
    params: {
      opdDinkesId: string;
      opdDisdikId: string;
      peraturanDaerahId: string;
      permenpanId: string;
      pergubLayananId: string;
    },
  ): Promise<void> {
    const pairs = [
      { opdId: params.opdDinkesId, peraturanId: params.peraturanDaerahId },
      { opdId: params.opdDinkesId, peraturanId: params.permenpanId },
      { opdId: params.opdDisdikId, peraturanId: params.peraturanDaerahId },
      { opdId: params.opdDisdikId, peraturanId: params.pergubLayananId },
    ];

    for (const pair of pairs) {
      await tx.oPDPeraturan.upsert({
        where: { opdId_peraturanId: pair },
        create: pair,
        update: {},
      });
    }
  }

  private async seedPelaksana(
    tx: Prisma.TransactionClient,
    params: { opdDinkesId: string; opdDisdikId: string },
  ): Promise<void> {
    const entries = [
      { opdId: params.opdDinkesId, nama: 'Front Office Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Kasubag Pelayanan Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Dokter Pemeriksa' },
      { opdId: params.opdDinkesId, nama: 'Petugas Imunisasi Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Petugas Surveilans Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Tim Gizi Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Petugas Rawat Inap Dinkes' },
      { opdId: params.opdDinkesId, nama: 'Petugas Farmasi Dinkes' },
      { opdId: params.opdDisdikId, nama: 'Tim Penerimaan PPDB Disdik' },
      { opdId: params.opdDisdikId, nama: 'Seksi Akreditasi Disdik' },
      { opdId: params.opdDisdikId, nama: 'Tim Akreditasi Disdik' },
    ];

    for (const entry of entries) {
      await this.upsertPelaksanaByNama(tx, entry.opdId, entry.nama);
    }
  }

  private async upsertPelaksanaByNama(
    tx: Prisma.TransactionClient,
    opdId: string,
    nama: string,
  ): Promise<void> {
    const existing = await tx.pelaksana.findFirst({
      where: { opdId, nama },
      select: { pelaksanaId: true },
    });
    if (existing !== null) {
      return;
    }
    await tx.pelaksana.create({
      data: { opdId, nama },
      select: { pelaksanaId: true },
    });
  }
}
