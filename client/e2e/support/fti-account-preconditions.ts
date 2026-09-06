import { expect } from '@playwright/test'

import type { RoleApiFactory } from '../fixtures/business-test'
import { targetUsers, type E2eUser } from '../fixtures/users'
import { toApiUrl, unwrapApiData } from './api'

const initialPassword = process.env.E2E_SEED_PASSWORD ?? '@Password123:)'

export interface PlatformAccountFixture {
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
  password: string
}

export interface PlatformAccountRow {
  penggunaId: string
  nama: string
  nip: string
  email: string
  jabatan: string
  pangkat: string
  nohp: string
  platformRole: 'SUPER_ADMIN' | 'USER'
  deletedAt: string | null
}

function stableNumber(input: string, width: number): string {
  let hash = 0
  for (const char of input) hash = (hash * 31 + char.charCodeAt(0)) % 10 ** width
  return String(hash).padStart(width, '0')
}

export function platformAccountFixture(key: string): PlatformAccountFixture {
  const timestamp = String(Date.now()).slice(-12).padStart(12, '0')
  const keyCode = stableNumber(key, 5)
  const short = `${key.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)}${keyCode}`
  return {
    nama: `FTI ${key}`.slice(0, 31),
    nip: `9${timestamp}${keyCode}`,
    email: `${short}@fti.test`.slice(0, 31),
    jabatan: 'Staf FTI',
    pangkat: 'III/a',
    nohp: '081234567890',
    password: initialPassword,
  }
}

export function toDynamicE2eUser(
  account: Pick<PlatformAccountFixture, 'email' | 'password'>,
  roleLabel: string,
): E2eUser {
  return {
    role: 'USER',
    roleLabel,
    email: account.email,
    password: account.password,
    landingPath: '/work',
  }
}

export function platformAccountLabel(account: Pick<PlatformAccountFixture, 'nama' | 'email'>): string {
  return `${account.nama} · ${account.email}`
}

export async function createPlatformAccountViaApi(
  apiFor: RoleApiFactory,
  fixture: PlatformAccountFixture,
): Promise<PlatformAccountRow> {
  const adminApi = await apiFor(targetUsers.admin)
  const response = await adminApi.post(toApiUrl('/platform-accounts'), {
    data: {
      nama: fixture.nama,
      nip: fixture.nip,
      email: fixture.email,
      jabatan: fixture.jabatan,
      pangkat: fixture.pangkat,
      nohp: fixture.nohp,
    },
  })
  await expect(response, `POST platform account ${fixture.email}`).toBeOK()
  return unwrapApiData<PlatformAccountRow>(await response.json())
}

export async function expectPlatformAccountDenied(
  apiFor: RoleApiFactory,
  actor: E2eUser,
  fixture: PlatformAccountFixture,
): Promise<void> {
  const api = await apiFor(actor)
  const response = await api.post(toApiUrl('/platform-accounts'), {
    data: {
      nama: fixture.nama,
      nip: fixture.nip,
      email: fixture.email,
      jabatan: fixture.jabatan,
      pangkat: fixture.pangkat,
      nohp: fixture.nohp,
    },
  })
  expect(response.status()).toBe(403)
}
