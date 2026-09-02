import { expect, type APIRequestContext } from '@playwright/test'

import type { RoleApiFactory } from '../fixtures/business-test'
import type { E2eUser } from '../fixtures/users'
import { users } from '../fixtures/users'
import { apiGet, apiPost, toApiUrl, unwrapApiData } from './api'

export interface AdminUserRow {
  penggunaId: string
  nama: string
  email: string
  platformRole: string
}

export interface DepartmentRow {
  departmentId: string
  nama: string
}

export interface ProcessMemberRow {
  penggunaId: string
  pengguna: AdminUserRow
}

export interface ProcessAdminRow {
  processId: string
  nama: string
  scope: 'FACULTY' | 'DEPARTMENT'
  departmentId: string | null
  ownerId: string
  department: DepartmentRow | null
  owner: AdminUserRow
  members: ProcessMemberRow[]
}

export interface ProcessContextRow {
  processId: string
  nama: string
  scope: 'FACULTY' | 'DEPARTMENT'
  departmentId: string | null
  ownerId: string
  department?: DepartmentRow | null
}

export interface AuthorityRow {
  authorityKey: string
  authority: 'DEAN' | 'HEAD_OF_DEPARTMENT'
  departmentId: string | null
  holderId: string
}

export function adminUserLabel(user: AdminUserRow): string {
  return `${user.nama} · ${user.email}`
}

export async function adminApi(apiFor: RoleApiFactory): Promise<APIRequestContext> {
  return apiFor(users.pjEvaluator)
}

export async function listAdminUsers(apiFor: RoleApiFactory): Promise<AdminUserRow[]> {
  return apiGet<AdminUserRow[]>(await adminApi(apiFor), '/process-admin/users')
}

export async function listAdminDepartments(apiFor: RoleApiFactory): Promise<DepartmentRow[]> {
  return apiGet<DepartmentRow[]>(await adminApi(apiFor), '/process-admin/departments')
}

export async function listAdminProcesses(apiFor: RoleApiFactory): Promise<ProcessAdminRow[]> {
  return apiGet<ProcessAdminRow[]>(await adminApi(apiFor), '/process-admin/processes')
}

export async function listMyProcesses(
  apiFor: RoleApiFactory,
  actor: E2eUser,
): Promise<ProcessContextRow[]> {
  return apiGet<ProcessContextRow[]>(await apiFor(actor), '/process-context/mine')
}

export async function listMyAuthorities(
  apiFor: RoleApiFactory,
  actor: E2eUser,
): Promise<AuthorityRow[]> {
  return apiGet<AuthorityRow[]>(await apiFor(actor), '/organizational-authority/mine')
}

export async function createDepartmentViaAdminApi(
  apiFor: RoleApiFactory,
  name: string,
): Promise<DepartmentRow> {
  return apiPost<DepartmentRow>(await adminApi(apiFor), '/process-admin/departments', { nama: name })
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

export async function assignDepartmentHeadViaAdminApi(
  apiFor: RoleApiFactory,
  departmentId: string,
  holderId: string,
): Promise<AuthorityRow> {
  const context = await adminApi(apiFor)
  const response = await context.put(
    toApiUrl(`/organizational-authority/departments/${departmentId}/head`),
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

export function requireDepartment(
  departments: DepartmentRow[],
  name: string,
): DepartmentRow {
  const department = departments.find((candidate) => candidate.nama === name)
  if (!department) throw new Error(`Department E2E tidak ditemukan: ${name}`)
  return department
}

export function requireProcess(processes: ProcessAdminRow[], name: string): ProcessAdminRow {
  const process = processes.find((candidate) => candidate.nama === name)
  if (!process) throw new Error(`Process E2E tidak ditemukan: ${name}`)
  return process
}
