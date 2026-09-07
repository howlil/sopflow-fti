import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../generated/prisma';
import {
  PejabatBerwenang,
  LingkupOrganisasi,
  PlatformRole,
  StatusKeaktifanProsesBisnis,
} from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';

const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_SEED_PASSWORD = '@Password123:)';

export interface SeedUserInput {
  readonly email: string;
  readonly nama: string;
  readonly platformRole?: PlatformRole;
  readonly nip: string;
  readonly jabatan: string;
  readonly pangkat: string;
  readonly nohp: string;
}

export interface SeedUserRecord extends SeedUserInput {
  readonly penggunaId: string;
}

export interface SeedPeraturanInput {
  readonly nomor: string;
  readonly tahun: number;
  readonly nama: string;
  readonly tentang: string;
}

export const SEED_FTI_USERS: ReadonlyArray<SeedUserInput> = [
  {
    email: 'admin.fti@gmail.com',
    nama: 'Administrator FTI',
    platformRole: PlatformRole.SUPER_ADMIN,
    nip: '198501012009011100',
    jabatan: 'Administrator Sistem FTI',
    pangkat: 'Pembina',
    nohp: '6281234567890',
  },
  {
    email: 'dean.fti@gmail.com',
    nama: 'Prof. Dr. Ir. Ahmad Dahlan, M.Eng.',
    nip: '198501012009011103',
    jabatan: 'Dekan FTI',
    pangkat: 'Pembina Utama',
    nohp: '6281234567803',
  },
  {
    email: 'kadep.if@gmail.com',
    nama: 'Dr. Eng. Rudi Hermawan, M.T.',
    nip: '198501012009011104',
    jabatan: 'Ketua Jurusan Informatika',
    pangkat: 'Pembina',
    nohp: '6281234567804',
  },
  {
    email: 'kadep.si@gmail.com',
    nama: 'Dr. Nurul Hidayati, M.Kom.',
    nip: '198501012009011107',
    jabatan: 'Ketua Jurusan Sistem Informasi',
    pangkat: 'Pembina',
    nohp: '6281234567807',
  },
  {
    email: 'process.owner@gmail.com',
    nama: 'Ir. Hendri Gunawan, M.T.',
    nip: '198501012009011101',
    jabatan: 'Pemilik Proses',
    pangkat: 'Penata',
    nohp: '6281234567801',
  },
  {
    email: 'process.member@gmail.com',
    nama: 'Rian Pratama, S.Kom.',
    nip: '198501012009011102',
    jabatan: 'Penyusun SOP Fakultas',
    pangkat: 'Penata',
    nohp: '6281234567802',
  },
  {
    email: 'process.member.if@gmail.com',
    nama: 'Dian Paramita, S.Kom.',
    nip: '198501012009011105',
    jabatan: 'Penyusun SOP Informatika',
    pangkat: 'Penata',
    nohp: '6281234567805',
  },
  {
    email: 'process.member.si@gmail.com',
    nama: 'Arief Wicaksono, S.Kom.',
    nip: '198501012009011106',
    jabatan: 'Penyusun SOP Sistem Informasi',
    pangkat: 'Penata',
    nohp: '6281234567806',
  },
];

export const SEED_FTI_PERATURAN: ReadonlyArray<SeedPeraturanInput> = [
  {
    nomor: 'Permendikbudristek 53/2023',
    tahun: 2023,
    nama: 'Standar Nasional Dikti',
    tentang: 'Penjaminan mutu dan standar nasional pada perguruan tinggi.',
  },
  {
    nomor: 'Peraturan Dekan 01/2024',
    tahun: 2024,
    nama: 'Tata Kelola SOP FTI',
    tentang: 'Pedoman penyusunan, review, TTE, dan lifecycle SOP di lingkungan FTI.',
  },
  {
    nomor: 'Peraturan Rektor 12/2023',
    tahun: 2023,
    nama: 'Penyelenggaraan Akademik',
    tentang: 'Ketentuan penyelenggaraan pembelajaran dan layanan akademik universitas.',
  },
];

export const SEED_FTI_PELAKSANA = [
  'Dekan',
  'Wakil Dekan Akademik',
  'Ketua Jurusan Informatika',
  'Ketua Jurusan Sistem Informasi',
  'Dosen Pembimbing Akademik',
  'Administrasi Akademik',
  'Laboran',
  'Mahasiswa',
  'Tenaga Kependidikan',
] as const;

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
      const users = await this.seedUsers(tx, hashedPassword);
      const deptIf = await this.ensureDepartemen(tx, 'Informatika');
      const deptSi = await this.ensureDepartemen(tx, 'Sistem Informasi');
      const ownerId = users['process.owner@gmail.com'].penggunaId;
      const adminId = users['admin.fti@gmail.com'].penggunaId;

      await this.ensureKewenanganPenanggungJawabProsesBisnis(tx, ownerId, adminId, LingkupOrganisasi.FACULTY, null);
      await this.ensureKewenanganPenanggungJawabProsesBisnis(
        tx,
        ownerId,
        adminId,
        LingkupOrganisasi.DEPARTMENT,
        deptIf.departemenId,
      );
      await this.ensureKewenanganPenanggungJawabProsesBisnis(
        tx,
        ownerId,
        adminId,
        LingkupOrganisasi.DEPARTMENT,
        deptSi.departemenId,
      );

      const processFaculty = await this.ensureProsesBisnis(
        tx,
        'Pengelolaan Akademik FTI',
        LingkupOrganisasi.FACULTY,
        ownerId,
        null,
      );
      const processIf = await this.ensureProsesBisnis(
        tx,
        'Layanan Akademik Informatika',
        LingkupOrganisasi.DEPARTMENT,
        ownerId,
        deptIf.departemenId,
      );
      const processSi = await this.ensureProsesBisnis(
        tx,
        'Layanan Akademik Sistem Informasi',
        LingkupOrganisasi.DEPARTMENT,
        ownerId,
        deptSi.departemenId,
      );

      await this.ensureAnggotaProsesBisnis(
        tx,
        processFaculty.prosesBisnisId,
        users['process.member@gmail.com'].penggunaId,
      );
      await this.ensureAnggotaProsesBisnis(
        tx,
        processIf.prosesBisnisId,
        users['process.member.if@gmail.com'].penggunaId,
      );
      await this.ensureAnggotaProsesBisnis(
        tx,
        processSi.prosesBisnisId,
        users['process.member.si@gmail.com'].penggunaId,
      );

      await this.seedPejabatBerwenang(tx, {
        deanId: users['dean.fti@gmail.com'].penggunaId,
        kadepIfId: users['kadep.if@gmail.com'].penggunaId,
        kadepSiId: users['kadep.si@gmail.com'].penggunaId,
        deptIfId: deptIf.departemenId,
        deptSiId: deptSi.departemenId,
      });

      await this.seedPeraturan(tx, adminId);
      await this.seedPelaksana(tx);
    });

    this.logger.log(
      'Seed FTI native selesai: identity netral, Departemen, Proses Bisnis, owner eligibility, membership, Dean/HOD authority, Peraturan global, dan Pelaksana global.',
    );
    this.logger.warn(
      `Login seed menggunakan SEED_DEFAULT_PASSWORD (default ${DEFAULT_SEED_PASSWORD}).`,
    );
  }

  private async seedUsers(
    tx: Prisma.TransactionClient,
    hashedPassword: string,
  ): Promise<Record<string, SeedUserRecord>> {
    const result: Record<string, SeedUserRecord> = {};
    for (const user of SEED_FTI_USERS) {
      const persisted = await tx.pengguna.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          nama: user.nama,
          kataSandi: hashedPassword,
          platformRole: user.platformRole ?? PlatformRole.USER,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
        },
        update: {
          nama: user.nama,
          kataSandi: hashedPassword,
          platformRole: user.platformRole ?? PlatformRole.USER,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
          deletedAt: null,
        },
        select: { penggunaId: true },
      });
      result[user.email] = { ...user, penggunaId: persisted.penggunaId };
    }
    return result;
  }

  private async ensureDepartemen(
    tx: Prisma.TransactionClient,
    nama: string,
  ): Promise<{ departemenId: string; nama: string }> {
    const existing = await tx.departemen.findUnique({
      where: { nama },
      select: { departemenId: true, nama: true },
    });
    return (
      existing ??
      tx.departemen.create({
        data: { nama },
        select: { departemenId: true, nama: true },
      })
    );
  }

  private async ensureKewenanganPenanggungJawabProsesBisnis(
    tx: Prisma.TransactionClient,
    penggunaId: string,
    grantedById: string,
    scope: LingkupOrganisasi,
    departemenId: string | null,
  ): Promise<void> {
    const scopeKey = scope === LingkupOrganisasi.FACULTY ? 'FACULTY' : `DEPARTMENT:${departemenId}`;
    await tx.kewenanganPenanggungJawabProsesBisnis.upsert({
      where: { penggunaId_scopeKey: { penggunaId, scopeKey } },
      create: { penggunaId, scope, departemenId, scopeKey, grantedById },
      update: { scope, departemenId, grantedById, revokedAt: null },
    });
  }

  private async ensureProsesBisnis(
    tx: Prisma.TransactionClient,
    nama: string,
    scope: LingkupOrganisasi,
    ownerId: string,
    departemenId: string | null,
  ): Promise<{ prosesBisnisId: string; nama: string }> {
    const existing = await tx.prosesBisnis.findFirst({
      where: { nama },
      select: { prosesBisnisId: true, nama: true },
    });
    const process =
      existing === null
        ? await tx.prosesBisnis.create({
            data: { nama, scope, ownerId, departemenId },
            select: { prosesBisnisId: true, nama: true },
          })
        : await tx.prosesBisnis.update({
            where: { prosesBisnisId: existing.prosesBisnisId },
            data: { scope, ownerId, departemenId },
            select: { prosesBisnisId: true, nama: true },
          });

    await tx.statusProsesBisnis.upsert({
      where: { prosesBisnisId: process.prosesBisnisId },
      create: { prosesBisnisId: process.prosesBisnisId, status: StatusKeaktifanProsesBisnis.ACTIVE },
      update: { status: StatusKeaktifanProsesBisnis.ACTIVE, archivedAt: null, archivedReason: null },
    });
    return process;
  }

  private async ensureAnggotaProsesBisnis(
    tx: Prisma.TransactionClient,
    prosesBisnisId: string,
    penggunaId: string,
  ): Promise<void> {
    await tx.anggotaProsesBisnis.upsert({
      where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId } },
      create: { prosesBisnisId, penggunaId },
      update: {},
    });
  }

  private async seedPejabatBerwenang(
    tx: Prisma.TransactionClient,
    params: {
      deanId: string;
      kadepIfId: string;
      kadepSiId: string;
      deptIfId: string;
      deptSiId: string;
    },
  ): Promise<void> {
    const assignments = [
      {
        authorityKey: 'DEAN',
        authority: PejabatBerwenang.DEAN,
        departemenId: null,
        holderId: params.deanId,
      },
      {
        authorityKey: `HEAD_OF_DEPARTMENT:${params.deptIfId}`,
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        departemenId: params.deptIfId,
        holderId: params.kadepIfId,
      },
      {
        authorityKey: `HEAD_OF_DEPARTMENT:${params.deptSiId}`,
        authority: PejabatBerwenang.HEAD_OF_DEPARTMENT,
        departemenId: params.deptSiId,
        holderId: params.kadepSiId,
      },
    ];

    for (const assignment of assignments) {
      await tx.penugasanPejabatBerwenang.upsert({
        where: { authorityKey: assignment.authorityKey },
        create: assignment,
        update: {
          authority: assignment.authority,
          departemenId: assignment.departemenId,
          holderId: assignment.holderId,
        },
      });
    }
  }

  private async seedPeraturan(
    tx: Prisma.TransactionClient,
    lastEditedById: string,
  ): Promise<void> {
    for (const peraturan of SEED_FTI_PERATURAN) {
      await tx.peraturan.upsert({
        where: { nomor_tahun: { nomor: peraturan.nomor, tahun: peraturan.tahun } },
        create: { ...peraturan, lastEditedById },
        update: {
          nama: peraturan.nama,
          tentang: peraturan.tentang,
          lastEditedById,
        },
      });
    }
  }

  private async seedPelaksana(tx: Prisma.TransactionClient): Promise<void> {
    for (const nama of SEED_FTI_PELAKSANA) {
      await tx.pelaksana.upsert({
        where: { nama },
        create: { nama },
        update: {},
      });
    }
  }
}
