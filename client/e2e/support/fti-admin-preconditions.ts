import { expect, type APIRequestContext } from '@playwright/test'

import type { RoleApiFactory } from '../fixtures/business-test'
import { targetUsers, type E2eUser } from '../fixtures/users'
import { apiGet, apiPost, toApiUrl, unwrapApiData } from './api'

export interface AdminUserRow {
  penggunaId: string
  nama: string
  email: string
  platformRole: string
}

export interface DepartemenRow {
  departemenId: string
  nama: string
}

export interface AnggotaProsesBisnisRow {
  penggunaId: string
  pengguna: AdminUserRow
}

export interface ProsesBisnisAdminRow {
  prosesBisnisId: string
  nama: string
  scope: 'FACULTY' | 'DEPARTMENT'
  departemenId: string | null
  ownerId: string
  department: DepartemenRow | null
  owner: AdminUserRow
  members: AnggotaProsesBisnisRow[]
}

export interface ProsesBisnisContextRow {
  prosesBisnisId: string
  nama: string
  scope: 'FACULTY' | 'DEPARTMENT'
  departemenId: string | null
  ownerId: string
  department?: DepartemenRow | null
}

export interface AuthorityRow {
  authorityKey: string
  authority: 'DEAN' | 'HEAD_OF_DEPARTMENT'
  departemenId: string | null
  holderId: string
}

export function adminUserLabel(user: AdminUserRow): string {
  return `${user.nama} · ${user.email}`
}

export async function adminApi(apiFor: RoleApiFactory): Promise<APIRequestContext> {
  return apiFor(targetUsers.admin)
}

export async function listAdminUsers(apiFor: RoleApiFactory): Promise<AdminUserRow[]> {
  return apiGet<AdminUserRow[]>(await adminApi(apiFor), '/administrasi-proses-bisnis/users')
}

export async function listAdminDepartemens(apiFor: RoleApiFactory): Promise<DepartemenRow[]> {
  return apiGet<DepartemenRow[]>(await adminApi(apiFor), '/administrasi-proses-bisnis/departments')
}

export async function listAdminProsesBisnises(apiFor: RoleApiFactory): Promise<ProsesBisnisAdminRow[]> {
  return apiGet<ProsesBisnisAdminRow[]>(await adminApi(apiFor), '/administrasi-proses-bisnis/processes')
}

export async function listMyProsesBisnises(
  apiFor: RoleApiFactory,
  actor: E2eUser,
): Promise<ProsesBisnisContextRow[]> {
  return apiGet<ProsesBisnisContextRow[]>(await apiFor(actor), '/konteks-proses-bisnis/mine')
}

export async function listMyAuthorities(
  apiFor: RoleApiFactory,
  actor: E2eUser,
): Promise<AuthorityRow[]> {
  return apiGet<AuthorityRow[]>(await apiFor(actor), '/organizational-authority/mine')
}

export async function createDepartemenViaAdminApi(
  apiFor: RoleApiFactory,
  name: string,
): Promise<DepartemenRow> {
  return apiPost<DepartemenRow>(await adminApi(apiFor), '/administrasi-proses-bisnis/departments', { nama: name })
}

export async function assignDeanViaAdminApi(
  apiFor: RoleApiFactory,
  holderId: string,
): Promise<AuthorityRow> {
  const context = await adminApi(apiFor)
  const response = await context.put(toApiUrl('/organizational-authority/dean'), {
    data: { penggunaId: holderId },
  })
  await expect(response, 'PUT organizational-authority/dean').toBeOK()
  return unwrapApiData<AuthorityRow>(await response.json())
}

export async function assignDepartemenHeadViaAdminApi(
  apiFor: RoleApiFactory,
  departemenId: string,
  holderId: string,
): Promise<AuthorityRow> {
  const context = await adminApi(apiFor)
  const response = await context.put(
    toApiUrl(`/organizational-authority/departments/${departemenId}/head`),
    { data: { penggunaId: holderId } },
  )
  await expect(response, 'PUT organizational-authority department head').toBeOK()
  return unwrapApiData<AuthorityRow>(await response.json())
}

export function requireAdminUser(usersList: AdminUserRow[], email: string): AdminUserRow {
  const user = usersList.find((candidate) => candidate.email === email)
  if (!user) throw new Error(`Admin E2E user tidak ditemukan: ${email}`)
  return user
}

export function requireDepartemen(departments: DepartemenRow[], name: string): DepartemenRow {
  const department = departments.find((candidate) => candidate.nama === name)
  if (!department) throw new Error(`Departemen E2E tidak ditemukan: ${name}`)
  return department
}

export function requireProsesBisnis(processes: ProsesBisnisAdminRow[], name: string): ProsesBisnisAdminRow {
  const process = processes.find((candidate) => candidate.nama === name)
  if (!process) throw new Error(`ProsesBisnis E2E tidak ditemukan: ${name}`)
  return process
}
