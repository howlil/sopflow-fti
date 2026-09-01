export type RoleKey =
  | 'PJ_EVALUATOR'
  | 'EVALUATOR'
  | 'KEPALA_OPD'
  | 'PJ_PENYUSUN'
  | 'PENYUSUN'

export interface E2eUser {
  role: RoleKey
  roleLabel: string
  email: string
  password: string
  landingPath: string
}

const defaultPassword = process.env.E2E_SEED_PASSWORD ?? '@Password123:)'

/** Legacy-role identities used by the pre-existing compatibility E2E matrix. */
export const users = {
  pjEvaluator: {
    role: 'PJ_EVALUATOR',
    roleLabel: 'PJ Evaluator',
    email: process.env.E2E_PJ_EVALUATOR_EMAIL ?? 'pjevaluator@gmail.com',
    password: process.env.E2E_PJ_EVALUATOR_PASSWORD ?? defaultPassword,
    landingPath: '/pj-evaluator/grafik-evaluasi',
  },
  evaluator: {
    role: 'EVALUATOR',
    roleLabel: 'Evaluator',
    email: process.env.E2E_EVALUATOR_EMAIL ?? 'evaluator1@gmail.com',
    password: process.env.E2E_EVALUATOR_PASSWORD ?? defaultPassword,
    landingPath: '/evaluator/evaluasi',
  },
  kepalaOpd: {
    role: 'KEPALA_OPD',
    roleLabel: 'Kepala OPD',
    email: process.env.E2E_KEPALA_OPD_EMAIL ?? 'kepalaopd.dinkes@gmail.com',
    password: process.env.E2E_KEPALA_OPD_PASSWORD ?? defaultPassword,
    landingPath: '/kepala-opd/sop',
  },
  pjPenyusun: {
    role: 'PJ_PENYUSUN',
    roleLabel: 'PJ Penyusun',
    email: process.env.E2E_PJ_PENYUSUN_EMAIL ?? 'pjpenyusun.dinkes@gmail.com',
    password: process.env.E2E_PJ_PENYUSUN_PASSWORD ?? defaultPassword,
    landingPath: '/penyusun/sop',
  },
  penyusun: {
    role: 'PENYUSUN',
    roleLabel: 'Penyusun',
    email: process.env.E2E_PENYUSUN_EMAIL ?? 'penyusun.dinkes@gmail.com',
    password: process.env.E2E_PENYUSUN_PASSWORD ?? defaultPassword,
    landingPath: '/penyusun/sop',
  },
} satisfies Record<string, E2eUser>

/**
 * Target FTI identities intentionally share the transitional PENYUSUN account role.
 * Their actual capability comes from Process relationship or organizational authority.
 * Keep them outside `allUsers` so the legacy role matrix remains unchanged.
 */
export const targetUsers = {
  processOwner: {
    role: 'PENYUSUN',
    roleLabel: 'Process Owner',
    email: process.env.E2E_PROCESS_OWNER_EMAIL ?? 'process.owner@gmail.com',
    password: process.env.E2E_PROCESS_OWNER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  processMember: {
    role: 'PENYUSUN',
    roleLabel: 'Process Member',
    email: process.env.E2E_PROCESS_MEMBER_EMAIL ?? 'process.member@gmail.com',
    password: process.env.E2E_PROCESS_MEMBER_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  dean: {
    role: 'PENYUSUN',
    roleLabel: 'Dekan',
    email: process.env.E2E_DEAN_EMAIL ?? 'dean.fti@gmail.com',
    password: process.env.E2E_DEAN_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
  headOfDepartment: {
    role: 'PENYUSUN',
    roleLabel: 'Kepala Departemen',
    email: process.env.E2E_HEAD_OF_DEPARTMENT_EMAIL ?? 'kadep.if@gmail.com',
    password: process.env.E2E_HEAD_OF_DEPARTMENT_PASSWORD ?? defaultPassword,
    landingPath: '/work',
  },
} satisfies Record<string, E2eUser>

export const allUsers = Object.values(users)
export const allTargetUsers = Object.values(targetUsers)

export const navByRole: Record<RoleKey, string[]> = {
  PJ_EVALUATOR: [
    'Grafik Evaluasi',
    'OPD',
    'Penyusun',
    'Evaluator',
    'Evaluasi SOP',
  ],
  EVALUATOR: ['Evaluasi SOP'],
  KEPALA_OPD: ['Pantau SOP', 'Pengajuan SOP'],
  PJ_PENYUSUN: [
    'SOP',
    'Pelaksana SOP',
    'Peraturan',
    'Berita Acara',
  ],
  PENYUSUN: [
    'SOP',
    'Pelaksana SOP',
    'Peraturan',
  ],
}

export const protectedRouteMatrix: Record<RoleKey, string[]> = {
  PJ_EVALUATOR: [
    '/pj-evaluator/grafik-evaluasi',
    '/pj-evaluator/opd',
    '/pj-evaluator/penyusun',
    '/pj-evaluator/evaluator',
    '/pj-evaluator/evaluasi',
  ],
  EVALUATOR: ['/evaluator/evaluasi'],
  KEPALA_OPD: ['/kepala-opd/sop', '/kepala-opd/pengajuan'],
  PJ_PENYUSUN: [
    '/penyusun/sop',
    '/penyusun/pelaksana',
    '/penyusun/peraturan',
    '/penyusun/pj-penyusun/berita-acara',
  ],
  PENYUSUN: ['/penyusun/sop', '/penyusun/pelaksana', '/penyusun/peraturan'],
}

export const allProtectedRoutes = Array.from(
  new Set(Object.values(protectedRouteMatrix).flat()),
)

export const publicRoutes = ['/', '/login', '/arsip', '/validasi/pdf']
