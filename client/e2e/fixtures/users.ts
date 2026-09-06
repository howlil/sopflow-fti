export type PlatformRoleKey = 'SUPER_ADMIN' | 'USER'

export interface E2eUser {
  role: PlatformRoleKey
  roleLabel: string
  email: string
  password: string
  landingPath: string
}

const defaultPassword = process.env.E2E_SEED_PASSWORD ?? '@Password123:)'

/** Native FTI identities. Workflow capability comes from Process relationship or Organizational Authority. */
export const targetUsers = {
  admin: {
    role: 'SUPER_ADMIN',
    roleLabel: 'Admin Platform',
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin.fti@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? defaultPassword,
    landingPath: '/admin',
  },
  processOwner: {
    role: 'USER',
    roleLabel: 'Pemilik Proses',
    email: process.env.E2E_PROCESS_OWNER_EMAIL ?? 'process.owner@gmail.com',
    password: process.env.E2E_PROCESS_OWNER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  processMember: {
    role: 'USER',
    roleLabel: 'Penyusun SOP',
    email: process.env.E2E_PROCESS_MEMBER_EMAIL ?? 'process.member@gmail.com',
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
  headOfDepartment: {
    role: 'USER',
    roleLabel: 'Ketua Jurusan Informatika',
    email: process.env.E2E_HEAD_OF_DEPARTMENT_EMAIL ?? 'kadep.if@gmail.com',
    password: process.env.E2E_HEAD_OF_DEPARTMENT_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  departmentMember: {
    role: 'USER',
    roleLabel: 'Penyusun SOP Informatika',
    email: process.env.E2E_DEPARTMENT_MEMBER_EMAIL ?? 'process.member.if@gmail.com',
    password: process.env.E2E_DEPARTMENT_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  otherDepartmentMember: {
    role: 'USER',
    roleLabel: 'Penyusun SOP Sistem Informasi',
    email: process.env.E2E_OTHER_DEPARTMENT_MEMBER_EMAIL ?? 'process.member.si@gmail.com',
    password: process.env.E2E_OTHER_DEPARTMENT_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  otherHeadOfDepartment: {
    role: 'USER',
    roleLabel: 'Ketua Jurusan Sistem Informasi',
    email: process.env.E2E_OTHER_HEAD_OF_DEPARTMENT_EMAIL ?? 'kadep.si@gmail.com',
    password: process.env.E2E_OTHER_HEAD_OF_DEPARTMENT_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
} satisfies Record<string, E2eUser>

/**
 * Transitional symbol kept only so existing FTI journey files can reference the platform admin
 * while the legacy role matrix itself is deleted. The value is the native SUPER_ADMIN identity;
 * it does not carry PJ Evaluator authorization or persistence semantics.
 */
export const users = { pjEvaluator: targetUsers.admin } as const

export const allTargetUsers = Object.values(targetUsers)
export const publicRoutes = ['/', '/login', '/arsip', '/validasi/pdf']
