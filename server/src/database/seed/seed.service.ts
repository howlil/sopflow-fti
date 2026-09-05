import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  PeranPengguna,
  PlatformRole,
} from '../../generated/prisma';

const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_SEED_PASSWORD = '@Password123:)';

export const SEED_OPD_FTI = 'Fakultas Teknologi Informasi';

export interface SeedUserInput {
  readonly email: string;
  readonly nama: string;
  readonly peran: PeranPengguna;
  readonly platformRole?: PlatformRole;
  readonly nip: string;
  readonly jabatan: string;
  readonly pangkat: string;
  readonly nohp: string;
}

export interface SeedPeraturanInput {
  readonly nomor: string;
  readonly tahun: number;
  readonly nama: string;
  readonly tentang: string;
}

export interface SeedUserRecord extends SeedUserInput {
  readonly penggunaId: string;
  readonly opdId: string;
}

export const SEED_FTI_USERS: ReadonlyArray<SeedUserInput> = [
  {
    email: 'admin.fti@gmail.com',
    nama: 'Administrator FTI',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.SUPER_ADMIN,
    nip: '198501012009011100',
    jabatan: 'Administrator Sistem FTI',
    pangkat: 'Pembina',
    nohp: '6281234567890',
  },
  {
    email: 'pjevaluator@gmail.com',
    nama: 'PJ Evaluator E2E',
    peran: PeranPengguna.PJ_EVALUATOR,
    platformRole: PlatformRole.SUPER_ADMIN,
    nip: '198501012009011000',
    jabatan: 'Koordinator Evaluasi FTI',
    pangkat: 'Pembina',
    nohp: '6281234567899',
  },
  {
    email: 'dean.fti@gmail.com',
    nama: 'Prof. Dr. Ir. Ahmad Dahlan, M.Eng.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011103',
    jabatan: 'Dekan FTI',
    pangkat: 'Pembina Utama',
    nohp: '6281234567803',
  },
  {
    email: 'kadep.if@gmail.com',
    nama: 'Dr. Eng. Rudi Hermawan, M.T.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011104',
    jabatan: 'Kepala Departemen Informatika',
    pangkat: 'Pembina',
    nohp: '6281234567804',
  },
  {
    email: 'kadep.si@gmail.com',
    nama: 'Dr. Nurul Hidayati, M.Kom.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011107',
    jabatan: 'Kepala Departemen SI',
    pangkat: 'Pembina',
    nohp: '6281234567807',
  },
  {
    email: 'process.owner@gmail.com',
    nama: 'Ir. Hendri Gunawan, M.T.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011101',
    jabatan: 'Process Owner FTI',
    pangkat: 'Penata',
    nohp: '6281234567801',
  },
  {
    email: 'process.member@gmail.com',
    nama: 'Rian Pratama, S.Kom.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011102',
    jabatan: 'Process Member Fakultas',
    pangkat: 'Penata',
    nohp: '6281234567802',
  },
  {
    email: 'process.member.if@gmail.com',
    nama: 'Dian Paramita, S.Kom.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011105',
    jabatan: 'Process Member Informatika',
    pangkat: 'Penata',
    nohp: '6281234567805',
  },
  {
    email: 'process.member.si@gmail.com',
    nama: 'Arief Wicaksono, S.Kom.',
    peran: PeranPengguna.PENYUSUN,
    platformRole: PlatformRole.USER,
    nip: '198501012009011106',
    jabatan: 'Process Member SI',
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
    tentang: 'Pedoman penyusunan, evaluasi, dan pengesahan SOP di lingkungan FTI.',
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
  'Wadek Akademik',
  'Ketua Dep IF',
  'Ketua Dep SI',
  'Dosen PA',
  'Subag Akademik',
  'Laboran',
  'Mahasiswa',
  'Tendik',
  'Process Owner',
  'Process Member',
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
      // 1. Bersihkan data legacy jika ada
      await this.cleanupLegacyData(tx);

      // 2. Pastikan OPD FTI aktif sebagai jangkar relasi
      const ftiOpd = await this.ensureOpd(tx, SEED_OPD_FTI);

      // 3. Seed akun FTI
      const users = await this.seedUsers(tx, hashedPassword, ftiOpd.opdId);
      await this.seedRiwayatOpd(tx, Object.values(users));

      // 4. Seed Departemen FTI
      const deptIf = await this.ensureDepartment(tx, 'Teknik Informatika');
      const deptSi = await this.ensureDepartment(tx, 'Sistem Informasi');

      // 5. Seed Process FTI
      const ownerId = users['process.owner@gmail.com'].penggunaId;
      const processFaculty = await this.ensureProcess(
        tx,
        'Pengelolaan Akademik FTI',
        OrganizationalScope.FACULTY,
        ownerId,
        null,
      );
      const processIf = await this.ensureProcess(
        tx,
        'Layanan Akademik Informatika',
        OrganizationalScope.DEPARTMENT,
        ownerId,
        deptIf.departmentId,
      );
      const processSi = await this.ensureProcess(
        tx,
        'Layanan Akademik Sistem Informasi',
        OrganizationalScope.DEPARTMENT,
        ownerId,
        deptSi.departmentId,
      );

      // 6. Seed Keanggotaan Process (ProcessMember)
      await this.ensureProcessMember(
        tx,
        processFaculty.processId,
        users['process.member@gmail.com'].penggunaId,
      );
      await this.ensureProcessMember(
        tx,
        processIf.processId,
        users['process.member.if@gmail.com'].penggunaId,
      );
      await this.ensureProcessMember(
        tx,
        processSi.processId,
        users['process.member.si@gmail.com'].penggunaId,
      );

      // 7. Seed Penugasan Kewenangan Organisasi (Dekan & Kadep)
      await this.seedOrganizationalAuthority(tx, {
        deanId: users['dean.fti@gmail.com'].penggunaId,
        kadepIfId: users['kadep.if@gmail.com'].penggunaId,
        kadepSiId: users['kadep.si@gmail.com'].penggunaId,
        deptIfId: deptIf.departmentId,
        deptSiId: deptSi.departmentId,
      });

      // 8. Seed Peraturan FTI & Relasi OPDPeraturan
      const adminId = users['admin.fti@gmail.com'].penggunaId;
      const peraturan = await this.seedPeraturan(tx, adminId);
      await this.seedOpdPeraturan(
        tx,
        ftiOpd.opdId,
        Object.values(peraturan).map((p) => p.peraturanId),
      );

      // 9. Seed Master Pelaksana FTI
      await this.seedPelaksana(tx, ftiOpd.opdId);
    });

    this.logger.log(
      [
        'Seed FTI selesai.',
        'Data legacy berhasil dibersihkan dan digantikan dengan data FTI:',
        '1 OPD FTI, 2 Departemen, 3 Process, 9 Akun FTI (Dekan, Kadep, Owner, Member, Admin),',
        'kewenangan organisasi DEAN/HEAD_OF_DEPARTMENT, 3 Peraturan FTI, dan master Pelaksana FTI.',
      ].join(' '),
    );
    this.logger.warn(
      `Login seed menggunakan SEED_DEFAULT_PASSWORD (default ${DEFAULT_SEED_PASSWORD}).`,
    );
  }

  private async cleanupLegacyData(tx: Prisma.TransactionClient): Promise<void> {
    const legacyEmails = [
      'evaluator1@gmail.com',
      'kepalaopd.dinkes@gmail.com',
      'pjpenyusun.dinkes@gmail.com',
      'penyusun.dinkes@gmail.com',
      'kepalaopd.disdik@gmail.com',
      'pjpenyusun.disdik@gmail.com',
      'penyusun.disdik@gmail.com',
    ];

    await tx.riwayatOpdPengguna.deleteMany({
      where: { pengguna: { email: { in: legacyEmails } } },
    });

    await tx.pengguna.deleteMany({
      where: {
        email: { in: legacyEmails },
        detailSopDibuat: { none: {} },
        detailSopDiedit: { none: {} },
        processOwned: { none: {} },
        processMemberships: { none: {} },
      },
    });

    const legacyOpdNames = [
      'Biro Organisasi Sekretariat Daerah',
      'Dinas Kesehatan Provinsi',
      'Dinas Pendidikan Provinsi',
      'Dinas Kesehatan',
      'Dinas Pendidikan',
      'Biro Organisasi',
    ];

    const legacyOpds = await tx.oPD.findMany({
      where: { nama: { in: legacyOpdNames } },
      select: { opdId: true },
    });
    const legacyOpdIds = legacyOpds.map((o) => o.opdId);

    if (legacyOpdIds.length > 0) {
      await tx.oPDPeraturan.deleteMany({
        where: { opdId: { in: legacyOpdIds } },
      });

      await tx.pelaksana.deleteMany({
        where: {
          opdId: { in: legacyOpdIds },
          sopDetails: { none: {} },
          langkahSOP: { none: {} },
        },
      });

      await tx.riwayatOpdPengguna.deleteMany({
        where: { opdId: { in: legacyOpdIds } },
      });

      await tx.oPD.deleteMany({
        where: {
          opdId: { in: legacyOpdIds },
          pengguna: { none: {} },
          pelaksana: { none: {} },
        },
      });
    }

    const legacyPeraturanNomor = [
      '12 Tahun 2024',
      '7 Tahun 2023',
      '35 Tahun 2012',
      '15 Tahun 2022',
    ];
    await tx.oPDPeraturan.deleteMany({
      where: { peraturan: { nomor: { in: legacyPeraturanNomor } } },
    });
    await tx.peraturan.deleteMany({
      where: {
        nomor: { in: legacyPeraturanNomor },
        dasarHukum: { none: {} },
      },
    });
  }

  private async ensureOpd(
    tx: Prisma.TransactionClient,
    nama: string,
  ): Promise<{ opdId: string }> {
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

  private async ensureDepartment(
    tx: Prisma.TransactionClient,
    nama: string,
  ): Promise<{ departmentId: string; nama: string }> {
    const existing = await tx.department.findUnique({
      where: { nama },
      select: { departmentId: true, nama: true },
    });
    if (existing !== null) {
      return existing;
    }
    return tx.department.create({
      data: { nama },
      select: { departmentId: true, nama: true },
    });
  }

  private async ensureProcess(
    tx: Prisma.TransactionClient,
    nama: string,
    scope: OrganizationalScope,
    ownerId: string,
    departmentId: string | null,
  ): Promise<{ processId: string; nama: string }> {
    const existing = await tx.process.findFirst({
      where: { nama },
      select: { processId: true, nama: true },
    });
    if (existing !== null) {
      await tx.process.update({
        where: { processId: existing.processId },
        data: { scope, ownerId, departmentId },
      });
      return existing;
    }
    return tx.process.create({
      data: {
        nama,
        scope,
        ownerId,
        departmentId,
      },
      select: { processId: true, nama: true },
    });
  }

  private async ensureProcessMember(
    tx: Prisma.TransactionClient,
    processId: string,
    penggunaId: string,
  ): Promise<void> {
    const existing = await tx.processMember.findUnique({
      where: {
        processId_penggunaId: { processId, penggunaId },
      },
      select: { processId: true },
    });
    if (!existing) {
      await tx.processMember.create({
        data: { processId, penggunaId },
      });
    }
  }

  private async seedOrganizationalAuthority(
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
        authority: OrganizationalAuthority.DEAN,
        departmentId: null,
        holderId: params.deanId,
      },
      {
        authorityKey: `HEAD_OF_DEPARTMENT:${params.deptIfId}`,
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        departmentId: params.deptIfId,
        holderId: params.kadepIfId,
      },
      {
        authorityKey: `HEAD_OF_DEPARTMENT:${params.deptSiId}`,
        authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
        departmentId: params.deptSiId,
        holderId: params.kadepSiId,
      },
    ];

    for (const assignment of assignments) {
      await tx.organizationalAuthorityAssignment.upsert({
        where: { authorityKey: assignment.authorityKey },
        create: assignment,
        update: {
          authority: assignment.authority,
          departmentId: assignment.departmentId,
          holderId: assignment.holderId,
        },
      });
    }
  }

  private async seedUsers(
    tx: Prisma.TransactionClient,
    hashedPassword: string,
    opdId: string,
  ): Promise<Record<string, SeedUserRecord>> {
    const result: Record<string, SeedUserRecord> = {};
    for (const user of SEED_FTI_USERS) {
      const persisted = await tx.pengguna.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          opdId,
          nama: user.nama,
          kataSandi: hashedPassword,
          peran: user.peran,
          platformRole: user.platformRole ?? PlatformRole.USER,
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
          platformRole: user.platformRole ?? PlatformRole.USER,
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
          platformRole: true,
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
    for (const peraturan of SEED_FTI_PERATURAN) {
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
    opdId: string,
    peraturanIds: string[],
  ): Promise<void> {
    for (const peraturanId of peraturanIds) {
      await tx.oPDPeraturan.upsert({
        where: { opdId_peraturanId: { opdId, peraturanId } },
        create: { opdId, peraturanId },
        update: {},
      });
    }
  }

  private async seedPelaksana(
    tx: Prisma.TransactionClient,
    opdId: string,
  ): Promise<void> {
    for (const nama of SEED_FTI_PELAKSANA) {
      await this.upsertPelaksanaByNama(tx, opdId, nama);
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
