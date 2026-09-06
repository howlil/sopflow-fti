import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../generated/prisma';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  PlatformRole,
  ProcessLifecycleStatus,
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
      const deptIf = await this.ensureDepartment(tx, 'Informatika');
      const deptSi = await this.ensureDepartment(tx, 'Sistem Informasi');
      const ownerId = users['process.owner@gmail.com'].penggunaId;
      const adminId = users['admin.fti@gmail.com'].penggunaId;

      await this.ensureProcessOwnerAuthority(tx, ownerId, adminId, OrganizationalScope.FACULTY, null);
      await this.ensureProcessOwnerAuthority(
        tx,
        ownerId,
        adminId,
        OrganizationalScope.DEPARTMENT,
        deptIf.departmentId,
      );
      await this.ensureProcessOwnerAuthority(
        tx,
        ownerId,
        adminId,
        OrganizationalScope.DEPARTMENT,
        deptSi.departmentId,
      );

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

      await this.seedOrganizationalAuthority(tx, {
        deanId: users['dean.fti@gmail.com'].penggunaId,
        kadepIfId: users['kadep.if@gmail.com'].penggunaId,
        kadepSiId: users['kadep.si@gmail.com'].penggunaId,
        deptIfId: deptIf.departmentId,
        deptSiId: deptSi.departmentId,
      });

      await this.seedPeraturan(tx, adminId);
      await this.seedPelaksana(tx);
    });

    this.logger.log(
      'Seed FTI native selesai: identity netral, Departemen, Process, owner eligibility, membership, Dean/HOD authority, Peraturan global, dan Pelaksana global.',
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
          opdId: null,
          nama: user.nama,
          kataSandi: hashedPassword,
          peran: null,
          platformRole: user.platformRole ?? PlatformRole.USER,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
        },
        update: {
          opdId: null,
          nama: user.nama,
          kataSandi: hashedPassword,
          peran: null,
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

  private async ensureDepartment(
    tx: Prisma.TransactionClient,
    nama: string,
  ): Promise<{ departmentId: string; nama: string }> {
    const existing = await tx.department.findUnique({
      where: { nama },
      select: { departmentId: true, nama: true },
    });
    return (
      existing ??
      tx.department.create({
        data: { nama },
        select: { departmentId: true, nama: true },
      })
    );
  }

  private async ensureProcessOwnerAuthority(
    tx: Prisma.TransactionClient,
    penggunaId: string,
    grantedById: string,
    scope: OrganizationalScope,
    departmentId: string | null,
  ): Promise<void> {
    const scopeKey = scope === OrganizationalScope.FACULTY ? 'FACULTY' : `DEPARTMENT:${departmentId}`;
    await tx.processOwnerAuthority.upsert({
      where: { penggunaId_scopeKey: { penggunaId, scopeKey } },
      create: { penggunaId, scope, departmentId, scopeKey, grantedById },
      update: { scope, departmentId, grantedById, revokedAt: null },
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
    const process =
      existing === null
        ? await tx.process.create({
            data: { nama, scope, ownerId, departmentId },
            select: { processId: true, nama: true },
          })
        : await tx.process.update({
            where: { processId: existing.processId },
            data: { scope, ownerId, departmentId },
            select: { processId: true, nama: true },
          });

    await tx.processLifecycle.upsert({
      where: { processId: process.processId },
      create: { processId: process.processId, status: ProcessLifecycleStatus.ACTIVE },
      update: { status: ProcessLifecycleStatus.ACTIVE, archivedAt: null, archivedReason: null },
    });
    return process;
  }

  private async ensureProcessMember(
    tx: Prisma.TransactionClient,
    processId: string,
    penggunaId: string,
  ): Promise<void> {
    await tx.processMember.upsert({
      where: { processId_penggunaId: { processId, penggunaId } },
      create: { processId, penggunaId },
      update: {},
    });
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
