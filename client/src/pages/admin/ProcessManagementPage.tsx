import { useMemo, useState } from 'react'
import { useProcessAdministration } from '@/api/process-admin'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GrantProcessOwnerAuthorityPayload, OrganizationalScope } from '@/types/dto/process.dto'

const EMPTY_AUTHORITY: GrantProcessOwnerAuthorityPayload = {
  penggunaId: '',
  scope: 'FACULTY',
  departmentId: null,
}

export function ProcessManagementPage() {
  const {
    departments,
    users,
    processes,
    ownerAuthorities,
    isLoading,
    createDepartment,
    grantOwnerAuthority,
    revokeOwnerAuthority,
    isSaving,
  } = useProcessAdministration()
  const [departmentName, setDepartmentName] = useState('')
  const [authority, setAuthority] = useState<GrantProcessOwnerAuthorityPayload>(EMPTY_AUTHORITY)

  const eligibleUsers = useMemo(
    () => users.filter((user) => user.platformRole === 'USER'),
    [users],
  )

  const canGrant =
    authority.penggunaId !== '' &&
    (authority.scope === 'FACULTY' || authority.departmentId !== null)

  const changeScope = (scope: OrganizationalScope) => {
    setAuthority((current) => ({
      ...current,
      scope,
      departmentId: scope === 'FACULTY' ? null : current.departmentId,
    }))
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Governance Process' }]}
      title="Governance Process"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="space-y-5">
          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Kewenangan Process Owner</h2>
                <p className="text-sm text-secondary-foreground">
                  Admin menetapkan scope sekali. Setelah itu Process Owner membuat Process dan mengelola Penyusun SOP sendiri.
                </p>
              </div>
            </DataSurface.Header>
            <div className="space-y-4 p-4">
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Pengguna
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={authority.penggunaId}
                  onChange={(event) =>
                    setAuthority((current) => ({ ...current, penggunaId: event.target.value }))
                  }
                >
                  <option value="">Pilih calon Process Owner</option>
                  {eligibleUsers.map((user) => (
                    <option key={user.penggunaId} value={user.penggunaId}>
                      {user.nama} · {user.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Scope
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={authority.scope}
                  onChange={(event) => changeScope(event.target.value as OrganizationalScope)}
                >
                  <option value="FACULTY">Fakultas</option>
                  <option value="DEPARTMENT">Jurusan</option>
                </select>
              </label>

              {authority.scope === 'DEPARTMENT' ? (
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Jurusan
                  <select
                    className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={authority.departmentId ?? ''}
                    onChange={(event) =>
                      setAuthority((current) => ({ ...current, departmentId: event.target.value || null }))
                    }
                  >
                    <option value="">Pilih jurusan</option>
                    {departments.map((department) => (
                      <option key={department.departmentId} value={department.departmentId}>
                        {department.nama}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="flex justify-end">
                <Button
                  disabled={!canGrant || isSaving}
                  onClick={async () => {
                    try {
                      await grantOwnerAuthority(authority)
                      setAuthority(EMPTY_AUTHORITY)
                    } catch {
                      // Toast owns the error; keep input for correction.
                    }
                  }}
                >
                  Berikan kewenangan
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border border-t border-border">
              {ownerAuthorities.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada kewenangan Process Owner.</p>
              ) : (
                ownerAuthorities.map((row) => (
                  <div key={row.processOwnerAuthorityId} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.user?.nama ?? 'Pengguna tidak tersedia'}
                      </p>
                      <p className="text-xs text-secondary-foreground">
                        {row.scope === 'FACULTY' ? 'Fakultas' : row.department?.nama ?? 'Jurusan'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => revokeOwnerAuthority(row.processOwnerAuthorityId)}
                    >
                      Cabut
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DataSurface.Root>

          <DataSurface.Root>
            <DataSurface.Header>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">Oversight Process</h2>
                <p className="text-sm text-secondary-foreground">
                  Daftar ini untuk governance dan recovery. Operasi normal dilakukan oleh Process Owner.
                </p>
              </div>
            </DataSurface.Header>
            <div className="divide-y divide-border">
              {isLoading ? (
                <p className="p-4 text-sm text-secondary-foreground">Memuat Process...</p>
              ) : processes.length === 0 ? (
                <p className="p-4 text-sm text-secondary-foreground">Belum ada Process.</p>
              ) : (
                processes.map((process) => (
                  <div key={process.processId} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{process.nama}</h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-secondary-foreground">
                        {process.scope === 'FACULTY' ? 'Fakultas' : process.department?.nama ?? 'Jurusan'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      Owner: {process.owner.nama} · {process.members.length} Penyusun SOP
                    </p>
                  </div>
                ))
              )}
            </div>
          </DataSurface.Root>
        </div>

        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Struktur Jurusan</h2>
              <p className="text-sm text-secondary-foreground">
                Master data organisasi disiapkan Admin sebelum scope diberikan kepada Process Owner.
              </p>
            </div>
          </DataSurface.Header>
          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <Input
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                placeholder="Nama jurusan"
              />
              <Button
                variant="outline"
                disabled={departmentName.trim().length < 2 || isSaving}
                onClick={async () => {
                  try {
                    await createDepartment(departmentName.trim())
                    setDepartmentName('')
                  } catch {
                    // Toast already reports the error.
                  }
                }}
              >
                Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((department) => (
                <span
                  key={department.departmentId}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {department.nama}
                </span>
              ))}
            </div>
          </div>
        </DataSurface.Root>
      </div>
    </ListPageLayout>
  )
}
