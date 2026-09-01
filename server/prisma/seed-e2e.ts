import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  OrganizationalAuthority,
  OrganizationalScope,
  PeranPengguna,
  PlatformRole,
  PrismaClient,
} from '../src/generated/prisma';

const DEFAULT_PASSWORD = '@Password123:)';
const BCRYPT_SALT_ROUNDS = 10;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi untuk E2E seed`);
  return value;
}

function databasePort(): number {
  const value = Number(process.env.DATABASE_PORT ?? '3306');
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('DATABASE_PORT tidak valid');
  }
  return value;
}

const adapter = new PrismaMariaDb({
  host: required('DATABASE_HOST'),
  port: databasePort(),
  user: required('DATABASE_USER'),
  password: required('DATABASE_PASSWORD'),
  database: required('DATABASE_NAME'),
  connectionLimit: 4,
  connectTimeout: 15_000,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

type SeedUser = {
  email: string;
  nama: string;
  peran: PeranPengguna;
  platformRole?: PlatformRole;
  nip: string;
  jabatan: string;
  pangkat: string;
  nohp: string;
  opd: 'BIRO' | 'DINKES';
};

const legacyUsers: readonly SeedUser[] = [
  {
    email: 'pjevaluator@gmail.com',
    nama: 'PJ Evaluator E2E',
    peran: PeranPengguna.PJ_EVALUATOR,
    platformRole: PlatformRole.SUPER_ADMIN,
    nip: '198501012009011000',
    jabatan: 'PJ Evaluator SOP',
    pangkat: 'Pembina',
    nohp: '6281234567890',
    opd: 'BIRO',
  },
  {
    email: 'evaluator1@gmail.com',
    nama: 'Evaluator E2E',
    peran: PeranPengguna.EVALUATOR,
    nip: '198501012009011001',
    jabatan: 'Evaluator SOP',
    pangkat: 'Pembina',
    nohp: '6281234567891',
    opd: 'BIRO',
  },
  {
    email: 'kepalaopd.dinkes@gmail.com',
    nama: 'Kepala OPD E2E',
    peran: PeranPengguna.KEPALA_OPD,
    nip: '198501012009011005',
    jabatan: 'Kepala Dinkes',
    pangkat: 'Pembina',
    nohp: '6281234567895',
    opd: 'DINKES',
  },
  {
    email: 'pjpenyusun.dinkes@gmail.com',
    nama: 'PJ Penyusun E2E',
    peran: PeranPengguna.PJ_PENYUSUN,
    nip: '198501012009011003',
    jabatan: 'PJ Penyusun SOP',
    pangkat: 'Pembina',
    nohp: '6281234567893',
    opd: 'DINKES',
  },
  {
    email: 'penyusun.dinkes@gmail.com',
    nama: 'Penyusun E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011004',
    jabatan: 'Penyusun SOP',
    pangkat: 'Penata',
    nohp: '6281234567894',
    opd: 'DINKES',
  },
];

const targetUsers: readonly SeedUser[] = [
  {
    email: 'process.owner@gmail.com',
    nama: 'Process Owner E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011101',
    jabatan: 'Process Owner',
    pangkat: 'Penata',
    nohp: '6281234567801',
    opd: 'DINKES',
  },
  {
    email: 'process.member@gmail.com',
    nama: 'Process Member E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011102',
    jabatan: 'Process Member',
    pangkat: 'Penata',
    nohp: '6281234567802',
    opd: 'DINKES',
  },
  {
    email: 'dean.fti@gmail.com',
    nama: 'Dekan FTI E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011103',
    jabatan: 'Dekan FTI',
    pangkat: 'Pembina',
    nohp: '6281234567803',
    opd: 'DINKES',
  },
  {
    email: 'kadep.if@gmail.com',
    nama: 'Kadep Informatika E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011104',
    jabatan: 'Kepala Departemen Informatika',
    pangkat: 'Pembina',
    nohp: '6281234567804',
    opd: 'DINKES',
  },
  {
    email: 'process.member.if@gmail.com',
    nama: 'Process Member Informatika E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011105',
    jabatan: 'Process Member Informatika',
    pangkat: 'Penata',
    nohp: '6281234567805',
    opd: 'DINKES',
  },
  {
    email: 'process.member.si@gmail.com',
    nama: 'Process Member Sistem Informasi E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011106',
    jabatan: 'Process Member Sistem Informasi',
    pangkat: 'Penata',
    nohp: '6281234567806',
    opd: 'DINKES',
  },
  {
    email: 'kadep.si@gmail.com',
    nama: 'Kadep Sistem Informasi E2E',
    peran: PeranPengguna.PENYUSUN,
    nip: '198501012009011107',
    jabatan: 'Kepala Departemen Sistem Informasi',
    pangkat: 'Pembina',
    nohp: '6281234567807',
    opd: 'DINKES',
  },
];

const allSeedUsers = [...legacyUsers, ...targetUsers] as const;

async function main(): Promise<void> {
  const password =
    process.env.E2E_SEED_PASSWORD ?? process.env.SEED_DEFAULT_PASSWORD ?? DEFAULT_PASSWORD;
  const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const biro = await tx.oPD.create({ data: { nama: 'Biro Organisasi' } });
    const dinkes = await tx.oPD.create({ data: { nama: 'Dinas Kesehatan' } });
    const opdIds = { BIRO: biro.opdId, DINKES: dinkes.opdId } as const;
    const userIds = new Map<string, string>();

    for (const user of allSeedUsers) {
      const created = await tx.pengguna.create({
        data: {
          email: user.email,
          nama: user.nama,
          peran: user.peran,
          platformRole: user.platformRole ?? PlatformRole.USER,
          nip: user.nip,
          jabatan: user.jabatan,
          pangkat: user.pangkat,
          nohp: user.nohp,
          kataSandi: hash,
          opdId: opdIds[user.opd],
        },
      });
      userIds.set(user.email, created.penggunaId);

      await tx.riwayatOpdPengguna.create({
        data: {
          penggunaId: created.penggunaId,
          opdId: created.opdId,
          isAktif: true,
        },
      });
    }

    const getUserId = (email: string): string => {
      const penggunaId = userIds.get(email);
      if (!penggunaId) throw new Error(`Target E2E user tidak ditemukan: ${email}`);
      return penggunaId;
    };

    const departmentIf = await tx.department.create({
      data: { nama: 'Teknik Informatika' },
    });
    const departmentSi = await tx.department.create({
      data: { nama: 'Sistem Informasi' },
    });

    const facultyProcess = await tx.process.create({
      data: {
        nama: 'Pengelolaan Akademik FTI',
        scope: OrganizationalScope.FACULTY,
        ownerId: getUserId('process.owner@gmail.com'),
      },
    });
    const departmentProcessIf = await tx.process.create({
      data: {
        nama: 'Layanan Akademik Informatika',
        scope: OrganizationalScope.DEPARTMENT,
        departmentId: departmentIf.departmentId,
        ownerId: getUserId('process.owner@gmail.com'),
      },
    });
    const departmentProcessSi = await tx.process.create({
      data: {
        nama: 'Layanan Akademik Sistem Informasi',
        scope: OrganizationalScope.DEPARTMENT,
        departmentId: departmentSi.departmentId,
        ownerId: getUserId('process.owner@gmail.com'),
      },
    });

    await tx.processMember.createMany({
      data: [
        {
          processId: facultyProcess.processId,
          penggunaId: getUserId('process.member@gmail.com'),
        },
        {
          processId: departmentProcessIf.processId,
          penggunaId: getUserId('process.member.if@gmail.com'),
        },
        {
          processId: departmentProcessSi.processId,
          penggunaId: getUserId('process.member.si@gmail.com'),
        },
      ],
    });

    await tx.organizationalAuthorityAssignment.createMany({
      data: [
        {
          authorityKey: 'DEAN',
          authority: OrganizationalAuthority.DEAN,
          departmentId: null,
          holderId: getUserId('dean.fti@gmail.com'),
        },
        {
          authorityKey: `HEAD_OF_DEPARTMENT:${departmentIf.departmentId}`,
          authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
          departmentId: departmentIf.departmentId,
          holderId: getUserId('kadep.if@gmail.com'),
        },
        {
          authorityKey: `HEAD_OF_DEPARTMENT:${departmentSi.departmentId}`,
          authority: OrganizationalAuthority.HEAD_OF_DEPARTMENT,
          departmentId: departmentSi.departmentId,
          holderId: getUserId('kadep.si@gmail.com'),
        },
      ],
    });
  });

  console.log(
    'E2E seed selesai: 5 akun legacy, 7 identity target FTI, 3 Process, dan 3 kewenangan organisasi.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
