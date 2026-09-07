export type PlatformRoleKey = 'SUPER_ADMIN' | 'USER'

export interface E2eUser {
  role: PlatformRoleKey
  roleLabel: string
  email: string
  password: string
  landingPath: string
}

const defaultPassword = process.env.E2E_SEED_PASSWORD ?? '@Password123:)'

/** Native FTI identities. Workflow capability comes from ProsesBisnis relationship or Pejabat Berwenang. */
export const targetUsers = {
  admin: {
    role: 'SUPER_ADMIN',
    roleLabel: 'Admin Platform',
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin.fti@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? defaultPassword,
    landingPath: '/admin',
  },
  penanggungJawabProsesBisnis: {
    role: 'USER',
    roleLabel: 'Pemilik Proses',
    email: process.env.E2E_PROCESS_OWNER_EMAIL ?? 'process.penanggungJawab@gmail.com',
    password: process.env.E2E_PROCESS_OWNER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  anggotaProsesBisnis: {
    role: 'USER',
    roleLabel: 'Penyusun SOP',
    email: process.env.E2E_PROCESS_MEMBER_EMAIL ?? 'process.anggota@gmail.com',
    password: process.env.E2E_PROCESS_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  dean: {
    role: 'USER',
    roleLabel: 'Dekan',
    email: process.env.E2E_DEAN_EMAIL ?? 'dean.fti@gmail.com',
    password: process.env.E2E_DEAN_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  headOfDepartemen: {
    role: 'USER',
    roleLabel: 'Ketua Jurusan Informatika',
    email: process.env.E2E_HEAD_OF_DEPARTMENT_EMAIL ?? 'kadep.if@gmail.com',
    password: process.env.E2E_HEAD_OF_DEPARTMENT_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  departmentMember: {
    role: 'USER',
    roleLabel: 'Penyusun SOP Informatika',
    email: process.env.E2E_DEPARTMENT_MEMBER_EMAIL ?? 'process.anggota.if@gmail.com',
    password: process.env.E2E_DEPARTMENT_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  otherDepartemenMember: {
    role: 'USER',
    roleLabel: 'Penyusun SOP Sistem Informasi',
    email: process.env.E2E_OTHER_DEPARTMENT_MEMBER_EMAIL ?? 'process.anggota.si@gmail.com',
    password: process.env.E2E_OTHER_DEPARTMENT_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  otherHeadOfDepartemen: {
    role: 'USER',
    roleLabel: 'Ketua Jurusan Sistem Informasi',
    email: process.env.E2E_OTHER_HEAD_OF_DEPARTMENT_EMAIL ?? 'kadep.si@gmail.com',
    password: process.env.E2E_OTHER_HEAD_OF_DEPARTMENT_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
} satisfies Record<string, E2eUser>

export const allTargetUsers = Object.values(targetUsers)
export const publicRoutes = ['/', '/login', '/arsip', '/validasi/pdf']
