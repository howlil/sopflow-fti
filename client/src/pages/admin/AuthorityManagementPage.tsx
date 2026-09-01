import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useOrganizationalAuthorityConfiguration } from '@/api/organizational-authority'
import { useProcessAdministration } from '@/api/process-admin'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'

export function AuthorityManagementPage() {
  const { departments, users, isLoading: isProcessAdminLoading } = useProcessAdministration()
  const {
    configuration,
    isLoading: isAuthorityLoading,
    assignDean,
    assignDepartmentHead,
    isSaving,
  } = useOrganizationalAuthorityConfiguration()

  const dean = configuration.find((item) => item.authority === 'DEAN') ?? null
  const headByDepartmentId = useMemo(
    () =>
      new Map(
        configuration
          .filter(
            (item) =>
              item.authority === 'HEAD_OF_DEPARTMENT' && item.departmentId !== null,
          )
          .map((item) => [item.departmentId as string, item]),
      ),
    [configuration],
  )
  const isLoading = isProcessAdminLoading || isAuthorityLoading

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi' }, { label: 'Authority FTI' }]}
      title="Authority FTI"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Dean
              </h2>
              <p className="text-sm text-secondary-foreground">
                Final approver tunggal untuk semua Process scope Faculty.
              </p>
            </div>
          </DataSurface.Header>
          <div className="p-4">
            {isLoading ? (
              <p className="text-sm text-secondary-foreground">Memuat authority...</p>
            ) : (
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Dean aktif
                <select
                  className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={dean?.holderId ?? ''}
                  disabled={isSaving}
                  onChange={(event) => {
                    if (event.target.value) void assignDean(event.target.value)
                  }}
                >
                  <option value="">Belum dikonfigurasi</option>
                  {users.map((user) => (
                    <option key={user.penggunaId} value={user.penggunaId}>
                      {user.nama} · {user.email}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </DataSurface.Root>

        <DataSurface.Root>
          <DataSurface.Header>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">Kepala Departemen</h2>
              <p className="text-sm text-secondary-foreground">
                Setiap Department memiliki final approver sendiri untuk Process scope Department.
              </p>
            </div>
          </DataSurface.Header>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-secondary-foreground">Memuat departemen...</p>
            ) : departments.length === 0 ? (
              <p className="p-4 text-sm text-secondary-foreground">Belum ada Department.</p>
            ) : (
              departments.map((department) => {
                const assignment = headByDepartmentId.get(department.departmentId) ?? null
                return (
                  <div key={department.departmentId} className="space-y-2 p-4">
                    <p className="text-sm font-medium text-foreground">{department.nama}</p>
                    <select
                      aria-label={`Kepala Departemen ${department.nama}`}
                      className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={assignment?.holderId ?? ''}
                      disabled={isSaving}
                      onChange={(event) => {
                        if (event.target.value) {
                          void assignDepartmentHead({
                            departmentId: department.departmentId,
                            penggunaId: event.target.value,
                          })
                        }
                      }}
                    >
                      <option value="">Belum dikonfigurasi</option>
                      {users.map((user) => (
                        <option key={user.penggunaId} value={user.penggunaId}>
                          {user.nama} · {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })
            )}
          </div>
        </DataSurface.Root>
      </div>
    </ListPageLayout>
  )
}
